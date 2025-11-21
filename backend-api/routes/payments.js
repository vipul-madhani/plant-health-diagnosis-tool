const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Analysis = require('../models/Analysis');
const Consultation = require('../models/Consultation');
const { sendEmail } = require('../services/email');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// ========================================
// POST /api/payments/create-order
// Create payment order for detailed report or consultation
// ========================================
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { type, analysisId, amount } = req.body;

    // Validate type
    if (!['detailed_report', 'consultation'].includes(type)) {
      return res.status(400).json({ error: 'Invalid payment type' });
    }

    // Validate amount
    const expectedAmount =
      type === 'detailed_report'
        ? parseInt(process.env.DETAILED_REPORT_AMOUNT) || 99
        : parseInt(process.env.CONSULTATION_AMOUNT) || 199;

    if (amount !== expectedAmount) {
      return res.status(400).json({
        error: 'Invalid amount',
        expected: expectedAmount,
      });
    }

    // Verify analysis exists
    if (analysisId) {
      const analysis = await Analysis.findById(analysisId);
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      if (analysis.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Calculate total with GST (18%)
    const gstAmount = Math.round(amount * 0.18);
    const totalAmount = amount + gstAmount;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.user.id,
        type,
        analysisId: analysisId || '',
      },
    });

    // Create payment record
    const payment = new Payment({
      userId: req.user.id,
      orderId: razorpayOrder.id,
      type,
      analysisId: analysisId || null,
      amount,
      gstAmount,
      totalAmount,
      status: 'pending',
    });

    await payment.save();

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Failed to create payment order',
      message: error.message,
    });
  }
});

// ========================================
// POST /api/payments/verify
// Verify payment signature from Razorpay
// ========================================
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    payment.status = 'completed';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.completedAt = new Date();
    await payment.save();

    // Process based on payment type
    if (payment.type === 'detailed_report') {
      // Mark analysis as paid and trigger detailed report generation
      const analysis = await Analysis.findById(payment.analysisId);
      if (analysis) {
        analysis.isPaid = true;
        analysis.paymentId = payment._id;
        await analysis.save();

        // Send email with report link
        await sendEmail({
          to: req.user.email,
          subject: 'Payment Successful - Your Detailed Report is Ready',
          template: 'payment-success-report',
          data: {
            userName: req.user.name,
            amount: payment.totalAmount,
            reportId: analysis._id,
          },
        });

        res.status(200).json({
          success: true,
          message: 'Payment verified',
          reportId: analysis._id,
        });
      }
    } else if (payment.type === 'consultation') {
      // Create consultation and assign to FIFO queue
      const consultation = new Consultation({
        farmerId: req.user.id,
        analysisId: payment.analysisId,
        amount: payment.amount,
        paymentId: payment._id,
        status: 'pending', // Will be assigned to agronomist via FIFO
      });

      await consultation.save();

      // Send confirmation email
      await sendEmail({
        to: req.user.email,
        subject: 'Payment Successful - Consultation Scheduled',
        template: 'payment-success-consultation',
        data: {
          userName: req.user.name,
          amount: payment.totalAmount,
          consultationId: consultation._id,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified',
        consultationId: consultation._id,
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message,
    });
  }
});

// ========================================
// POST /api/payments/webhook
// Razorpay webhook for payment events
// ========================================
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment.entity;

    // Handle different events
    switch (event) {
      case 'payment.captured':
        // Payment successful
        await handlePaymentSuccess(paymentData);
        break;

      case 'payment.failed':
        // Payment failed
        await handlePaymentFailure(paymentData);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ========================================
// GET /api/payments/history
// Get payment history for current user
// ========================================
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('type amount totalAmount status createdAt completedAt');

    const total = await Payment.countDocuments({ userId: req.user.id });

    res.status(200).json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Fetch payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================
async function handlePaymentSuccess(paymentData) {
  const payment = await Payment.findOne({ orderId: paymentData.order_id });
  if (payment && payment.status === 'pending') {
    payment.status = 'completed';
    payment.razorpayPaymentId = paymentData.id;
    payment.completedAt = new Date();
    await payment.save();
    console.log(`Payment ${payment._id} marked as completed`);
  }
}

async function handlePaymentFailure(paymentData) {
  const payment = await Payment.findOne({ orderId: paymentData.order_id });
  if (payment) {
    payment.status = 'failed';
    payment.failureReason = paymentData.error_description || 'Payment failed';
    await payment.save();
    console.log(`Payment ${payment._id} marked as failed`);
  }
}

module.exports = router;
