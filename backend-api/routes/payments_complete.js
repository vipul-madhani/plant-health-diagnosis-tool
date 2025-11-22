const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { createOrder, verifyPaymentSignature, fetchPayment, issueRefund } = require('../config/razorpay');
const { trackPaymentInitiated, trackPaymentSuccess, trackPaymentFailed } = require('../middleware/analytics');
const { sendPushNotification } = require('../config/firebase');
const Payment = require('../models/Payment');
const Analysis = require('../models/Analysis');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { sendEmail } = require('../services/email');

// ========================================
// POST /api/payments/create-order
// Create Razorpay order for payment
// ========================================
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { type, analysisId, amount } = req.body;

    // Validate type
    if (!['detailed_report', 'consultation'].includes(type)) {
      return res.status(400).json({ error: 'Invalid payment type' });
    }

    // Validate amount
    const expectedAmount = type === 'detailed_report' ? 99 : 199;
    if (amount !== expectedAmount) {
      return res.status(400).json({ 
        error: `Invalid amount. Expected ₹${expectedAmount} for ${type}` 
      });
    }

    // Verify analysis exists and belongs to user
    if (analysisId) {
      const analysis = await Analysis.findById(analysisId);
      if (!analysis || analysis.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized or invalid analysis' });
      }
    }

    // Generate unique receipt ID
    const receipt = `${type}_${Date.now()}_${req.user.id.slice(-6)}`;

    // Create Razorpay order
    const orderResult = await createOrder(amount, receipt, {
      userId: req.user.id,
      type,
      analysisId: analysisId || 'N/A',
    });

    if (!orderResult.success) {
      return res.status(500).json({ 
        error: 'Failed to create payment order',
        message: orderResult.error 
      });
    }

    // Save payment record
    const payment = new Payment({
      userId: req.user.id,
      orderId: orderResult.orderId,
      amount,
      currency: 'INR',
      type,
      analysisId: analysisId || null,
      status: 'created',
      receipt,
    });

    await payment.save();

    // Track analytics
    trackPaymentInitiated(req.user.id, {
      amount,
      type,
      orderId: orderResult.orderId,
    });

    res.status(200).json({
      success: true,
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      paymentId: payment._id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      message: error.message 
    });
  }
});

// ========================================
// POST /api/payments/verify
// Verify Razorpay payment signature
// ========================================
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing required payment details' });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      // Track failed payment
      const payment = await Payment.findOne({ orderId });
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = 'Invalid signature';
        await payment.save();

        trackPaymentFailed(req.user.id, {
          amount: payment.amount,
          type: payment.type,
          reason: 'Invalid signature',
        });
      }

      return res.status(400).json({ 
        success: false,
        error: 'Payment verification failed' 
      });
    }

    // Fetch payment details from Razorpay
    const paymentResult = await fetchPayment(paymentId);

    if (!paymentResult.success) {
      return res.status(500).json({ 
        error: 'Failed to fetch payment details',
        message: paymentResult.error 
      });
    }

    // Update payment record
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    payment.razorpayPaymentId = paymentId;
    payment.status = 'success';
    payment.paymentMethod = paymentResult.payment.method;
    payment.completedAt = new Date();
    await payment.save();

    // Track successful payment
    trackPaymentSuccess(req.user.id, {
      amount: payment.amount,
      type: payment.type,
      paymentId,
      orderId,
    });

    // Process based on payment type
    if (payment.type === 'detailed_report') {
      await processDetailedReportPayment(payment, req.user);
    } else if (payment.type === 'consultation') {
      await processConsultationPayment(payment, req.user);
    }

    res.status(200).json({
      success: true,
      paymentId: payment._id,
      status: 'success',
      type: payment.type,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      message: error.message 
    });
  }
});

// ========================================
// Helper: Process Detailed Report Payment
// ========================================
async function processDetailedReportPayment(payment, user) {
  try {
    // This is handled by /api/analysis/detailed/:analysisId route
    // Just send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Payment Successful - Generating Your Detailed Report',
      template: 'payment-success',
      data: {
        userName: user.name,
        amount: payment.amount,
        type: 'Detailed Plant Health Report',
        paymentId: payment.razorpayPaymentId,
      },
    });

    // Send push notification
    if (user.fcmToken) {
      await sendPushNotification(user.fcmToken, {
        title: 'Payment Successful! ✅',
        body: 'Your detailed report is being generated. You\'ll receive it shortly.',
      }, {
        type: 'payment_success',
        paymentId: payment._id.toString(),
      });
    }
  } catch (error) {
    console.error('Process detailed report payment error:', error);
  }
}

// ========================================
// Helper: Process Consultation Payment
// ========================================
async function processConsultationPayment(payment, user) {
  try {
    // Consultation is created after payment
    // Just send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Payment Successful - Connecting You with Agronomist',
      template: 'payment-success',
      data: {
        userName: user.name,
        amount: payment.amount,
        type: 'Agronomist Consultation',
        paymentId: payment.razorpayPaymentId,
      },
    });

    // Send push notification
    if (user.fcmToken) {
      await sendPushNotification(user.fcmToken, {
        title: 'Payment Successful! ✅',
        body: 'You\'re in the queue. An agronomist will join shortly.',
      }, {
        type: 'payment_success',
        paymentId: payment._id.toString(),
      });
    }
  } catch (error) {
    console.error('Process consultation payment error:', error);
  }
}

// ========================================
// GET /api/payments/my-payments
// Get user's payment history
// ========================================
router.get('/my-payments', authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');

    res.status(200).json({
      success: true,
      payments: payments.map(p => ({
        id: p._id,
        amount: p.amount,
        currency: p.currency,
        type: p.type,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
    });
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// ========================================
// POST /api/payments/webhook
// Razorpay webhook for payment updates
// ========================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'refund.created':
        await handleRefundCreated(event.payload.refund.entity);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ========================================
// Webhook Handlers
// ========================================
async function handlePaymentCaptured(paymentData) {
  const payment = await Payment.findOne({ razorpayPaymentId: paymentData.id });
  if (payment && payment.status !== 'success') {
    payment.status = 'success';
    payment.completedAt = new Date();
    await payment.save();

    console.log(`✅ Payment captured: ${paymentData.id}`);
  }
}

async function handlePaymentFailed(paymentData) {
  const payment = await Payment.findOne({ razorpayPaymentId: paymentData.id });
  if (payment) {
    payment.status = 'failed';
    payment.failureReason = paymentData.error_description || 'Payment failed';
    await payment.save();

    console.log(`❌ Payment failed: ${paymentData.id}`);

    // Notify user
    const user = await User.findById(payment.userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Payment Failed',
        template: 'payment-failed',
        data: {
          userName: user.name,
          amount: payment.amount,
          reason: payment.failureReason,
        },
      });
    }
  }
}

async function handleRefundCreated(refundData) {
  const payment = await Payment.findOne({ razorpayPaymentId: refundData.payment_id });
  if (payment) {
    payment.status = 'refunded';
    payment.refundId = refundData.id;
    payment.refundedAt = new Date();
    await payment.save();

    console.log(`🔄 Refund created: ${refundData.id}`);
  }
}

// ========================================
// POST /api/payments/refund
// Issue refund (Admin only)
// ========================================
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { paymentId, amount } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({ error: 'Cannot refund unsuccessful payment' });
    }

    // Issue refund
    const refundResult = await issueRefund(payment.razorpayPaymentId, amount);

    if (!refundResult.success) {
      return res.status(500).json({ 
        error: 'Refund failed',
        message: refundResult.error 
      });
    }

    // Update payment
    payment.status = 'refunded';
    payment.refundId = refundResult.refundId;
    payment.refundedAt = new Date();
    await payment.save();

    // Notify user
    const user = await User.findById(payment.userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: 'Refund Processed',
        template: 'payment-refund',
        data: {
          userName: user.name,
          amount: refundResult.amount,
          refundId: refundResult.refundId,
        },
      });
    }

    res.status(200).json({
      success: true,
      refundId: refundResult.refundId,
      amount: refundResult.amount,
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

module.exports = router;
