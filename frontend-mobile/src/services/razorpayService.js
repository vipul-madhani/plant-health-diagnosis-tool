import RazorpayCheckout from 'react-native-razorpay';
import api from '../api/api';

class RazorpayService {
  constructor() {
    this.keyId = ''; // Will be loaded from backend
  }

  async initializePayment(amount, type, metadata = {}) {
    try {
      // Create order on backend
      const orderResponse = await api.post('/payments/create-order', {
        amount,
        type,
        ...metadata,
      });

      const { orderId, keyId, orderDetails } = orderResponse.data;
      this.keyId = keyId;

      // Prepare Razorpay options
      const options = {
        description: this.getDescription(type),
        image: 'https://agriiq.com/logo.png',
        currency: 'INR',
        key: this.keyId,
        amount: amount * 100, // Convert to paise
        order_id: orderId,
        name: 'AgriIQ',
        prefill: {
          email: orderDetails.email || '',
          contact: orderDetails.phone || '',
          name: orderDetails.name || '',
        },
        theme: { color: '#4CAF50' },
        retry: { enabled: true, max_count: 3 },
      };

      // Open Razorpay checkout
      const paymentData = await RazorpayCheckout.open(options);

      // Verify payment on backend
      const verifyResponse = await this.verifyPayment(
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id,
        paymentData.razorpay_signature,
        type,
        metadata
      );

      return {
        success: true,
        paymentId: paymentData.razorpay_payment_id,
        orderId: paymentData.razorpay_order_id,
        ...verifyResponse.data,
      };
    } catch (error) {
      console.error('Payment error:', error);

      // Handle payment failure
      if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
        return {
          success: false,
          cancelled: true,
          message: 'Payment was cancelled',
        };
      }

      return {
        success: false,
        error: error.description || 'Payment failed',
        message: 'Unable to process payment. Please try again.',
      };
    }
  }

  async verifyPayment(paymentId, orderId, signature, type, metadata) {
    try {
      const response = await api.post('/payments/verify', {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        type,
        ...metadata,
      });

      return response;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error('Payment verification failed');
    }
  }

  getDescription(type) {
    switch (type) {
      case 'detailed_report':
        return 'Detailed Plant Analysis Report';
      case 'consultation':
        return 'Agronomist Consultation';
      default:
        return 'AgriIQ Service';
    }
  }
}

export default new RazorpayService();