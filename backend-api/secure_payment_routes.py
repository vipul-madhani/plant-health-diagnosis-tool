from jwt_decorators import jwt_required_role
from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query

secure_pay_bp = Blueprint('secure_pay', __name__, url_prefix='/api/secure/payment')

# User payment history
@secure_pay_bp.route('/history', methods=['GET'])
@jwt_required_role(['user','agronomist'])
def payment_history():
    user = getattr(request, 'user', {})
    user_id = user.get('user_id')
    query = "SELECT * FROM payments WHERE user_id=%s ORDER BY created_at DESC"
    rows = execute_query(query, params=(user_id,), fetch_all=True)
    return jsonify({'success': True, 'data': rows}), 200

# Add: Other endpoints for actual payment initiation/verification, tied to JWT when called from web/app
