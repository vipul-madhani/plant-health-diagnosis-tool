from jwt_decorators import jwt_required_role
from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query

secure_consult_bp = Blueprint('secure_consult', __name__, url_prefix='/api/secure/consultations')

# User submits new consultation
@secure_consult_bp.route('/', methods=['POST'])
@jwt_required_role(['user','agronomist'])
def submit_consultation():
    user = getattr(request, 'user', {})
    data = request.json
    query = '''INSERT INTO consultations (user_id, agronomist_id, plant_image_url, description, region, season, status, created_at) VALUES (%s, %s, %s, %s, %s, %s, 'pending', NOW())''
    params = (user.get('user_id'), data.get('agronomist_id'), data.get('plant_image_url'), data.get('description'), data.get('region'), data.get('season'))
    consult_id = execute_query(query, params=params, commit=True)
    return jsonify({'success': True, 'consultation_id': consult_id}), 201

# User/agronomist can view their consultations
@secure_consult_bp.route('/', methods=['GET'])
@jwt_required_role(['user','agronomist'])
def list_my_consults():
    user = getattr(request, 'user', {})
    query = "SELECT * FROM consultations WHERE user_id=%s OR agronomist_id=%s ORDER BY created_at DESC"
    params = (user.get('user_id'), user.get('user_id'))
    results = execute_query(query, params=params, fetch_all=True)
    return jsonify({'success': True, 'data': results}), 200

# User/agronomist can get one consultation (by id)
@secure_consult_bp.route('/<string:consultation_id>', methods=['GET'])
@jwt_required_role(['user','agronomist'])
def get_consultation(consultation_id):
    user = getattr(request, 'user', {})
    query = "SELECT * FROM consultations WHERE id=%s AND (user_id=%s OR agronomist_id=%s)"
    params = (consultation_id, user.get('user_id'), user.get('user_id'))
    result = execute_query(query, params=params, fetch_one=True)
    if not result:
        return jsonify({'error': 'Not found or unauthorized'}), 404
    return jsonify({'success': True, 'data': result}), 200

# User can delete own consultation if pending
@secure_consult_bp.route('/<string:consultation_id>', methods=['DELETE'])
@jwt_required_role(['user'])
def delete_my_consultation(consultation_id):
    user = getattr(request, 'user', {})
    result = execute_query("DELETE FROM consultations WHERE id=%s AND user_id=%s AND status='pending'", params=(consultation_id, user.get('user_id')), commit=True)
    return jsonify({'success': True, 'deleted': result}), 200
