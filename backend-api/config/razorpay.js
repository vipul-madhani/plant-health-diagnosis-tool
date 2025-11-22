const Razorpay = require('razorpay');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order for payment
 * @param {number} amount - Amount in INR (will be converted to paise)
 * @param {string} receipt - Unique receipt ID
 * @param {object} notes - Additional notes for the order
 */
async function createOrder(amount, receipt, notes = {}) {
  try {
    const options = {
      amount: amount * 100, // Convert to paise (₹1 = 100 paise)
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const crypto = require('crypto');
  
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Fetch payment details
 * @param {string} paymentId - Razorpay payment ID
 */
async function fetchPayment(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: payment.created_at,
      },
    };
  } catch (error) {
    console.error('Razorpay fetch payment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Issue refund for a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in INR (optional, full refund if not provided)
 */
async function issueRefund(paymentId, amount = null) {
  try {
    const options = amount ? { amount: amount * 100 } : {};
    const refund = await razorpay.payments.refund(paymentId, options);
    
    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  } catch (error) {
    console.error('Razorpay refund error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  razorpay,
  createOrder,
  verifyPaymentSignature,
  fetchPayment,
  issueRefund,
};
