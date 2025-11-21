from jwt_decorators import jwt_required_role
from flask import Blueprint, jsonify, request
from db.mysql_connection import execute_query

secure_plants_bp = Blueprint('secure_plants', __name__, url_prefix='/api/secure/plants')

@secure_plants_bp.route('/', methods=['GET'])
@jwt_required_role(['user', 'agronomist', 'admin'])
def list_my_plants():
    user = getattr(request, 'user', {})
    # Only show plants for logged-in user
    query = "SELECT * FROM user_plants WHERE user_id=%s ORDER BY planted_date DESC;"
    params = (user.get('user_id'),)
    results = execute_query(query, params=params, fetch_all=True)
    return jsonify({'success': True, 'data': results}), 200

@secure_plants_bp.route('/', methods=['POST'])
@jwt_required_role(['user', 'agronomist'])
def add_my_plant():
    user = getattr(request, 'user', {})
    data = request.json
    query = '''INSERT INTO user_plants (user_id, plant_name, variety, planted_date, health_status, notes, created_at) VALUES (%s, %s, %s, %s, %s, %s, NOW())''
    params = (user.get('user_id'), data.get('plant_name'), data.get('variety'), data.get('planted_date'), data.get('health_status','good'), data.get('notes'))
    plant_id = execute_query(query, params=params, commit=True)
    return jsonify({'success': True, 'plant_id': plant_id}), 201

@secure_plants_bp.route('/<int:plant_id>', methods=['PATCH'])
@jwt_required_role(['user', 'agronomist'])
def update_my_plant(plant_id):
    user = getattr(request, 'user', {})
    health_status = request.json.get('health_status')
    query = "UPDATE user_plants SET health_status=%s WHERE id=%s AND user_id=%s"
    params = (health_status, plant_id, user.get('user_id'))
    execute_query(query, params=params, commit=True)
    return jsonify({'success': True}), 200

@secure_plants_bp.route('/<int:plant_id>', methods=['DELETE'])
@jwt_required_role(['user', 'agronomist'])
def delete_my_plant(plant_id):
    user = getattr(request, 'user', {})
    query = "DELETE FROM user_plants WHERE id=%s AND user_id=%s"
    params = (plant_id, user.get('user_id'))
    execute_query(query, params=params, commit=True)
    return jsonify({'success': True}), 200
