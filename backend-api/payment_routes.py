#!/usr/bin/env python3
"""
Payment Routes - Razorpay Integration for Consultation Payments
"""

from flask import Blueprint, request, jsonify
import razorpay
import os
from datetime import datetime

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payment')

# Razorpay Credentials (setup in .env)
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Constants
PLATFORM_COMMISSION = float(os.getenv('PLATFORM_COMMISSION', 0.30))
AGRONOMIST_COMMISSION = float(os.getenv('AGRONOMIST_COMMISSION', 0.70))
DEFAULT_CONSULTATION_FEES = int(os.getenv('CONSULTATION_FEE', 299))

@payment_bp.route('/order', methods=['POST'])
def create_payment_order():
    """
    Create a Razorpay order for a consultation payment
    {
      amount: 29900,  # in paisa (INR x 100)
      currency: 'INR',
      notes: { user_id, consultation_id }
    }
    """
    try:
        data = request.get_json()
        amount = data.get('amount', DEFAULT_CONSULTATION_FEES) * 100
        user_id = data.get('user_id')
        consultation_id = data.get('consultation_id')

        razorpay_order = client.order.create({
            'amount': amount,
            'currency': 'INR',
            'receipt': f'CONSULT_{consultation_id}',
            'payment_capture': 1,
            'notes': {
                'user_id': user_id,
                'consultation_id': consultation_id
            },
        })
        return jsonify({
            'order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/verify', methods=['POST'])
def verify_payment():
    """
    Verify payment at callback - store in DB with 30/70 split
    {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      user_id, consultation_id
    }
    """
    try:
        data = request.get_json()
        params_dict = {
            'razorpay_order_id': data['razorpay_order_id'],
            'razorpay_payment_id': data['razorpay_payment_id'],
            'razorpay_signature': data['razorpay_signature']
        }
        verified = client.utility.verify_payment_signature(params_dict)
        if not verified:
            return jsonify({'error': 'Invalid payment signature'}), 400
        # TODO: Insert payment record into MySQL, update consultation/payment status
        # Calculate commission split
        # payout_platform = int(data['amount'] * PLATFORM_COMMISSION)
        # payout_agronomist = int(data['amount'] * AGRONOMIST_COMMISSION)
        return jsonify({'success': True, 'commission': {
            'platform': PLATFORM_COMMISSION,
            'agronomist': AGRONOMIST_COMMISSION
        }}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add more endpoints if needed (invoice, payout status, etc.)
