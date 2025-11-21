from jwt_decorators import jwt_required_role
from flask import Blueprint, jsonify, request
from db.mysql_connection import execute_query

user_bp = Blueprint('user_protected', __name__, url_prefix='/api/secure')

@user_bp.route('/dashboard', methods=['GET'])
@jwt_required_role(['user', 'agronomist', 'admin'])
def dashboard_summary():
    user = getattr(request, 'user', {})
    return jsonify({'msg': f"Welcome {user.get('email')}, role: {user.get('role')} (protected route)"}), 200

# Attach this blueprint to app for live protection testing and reference implementation.
