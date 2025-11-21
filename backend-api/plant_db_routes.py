from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query
from datetime import datetime

plant_db_bp = Blueprint('plant_db', __name__, url_prefix='/api/plants')

# Get all plants for a user
@plant_db_bp.route('/<int:user_id>', methods=['GET'])
def get_user_plants(user_id):
    try:
        query = "SELECT * FROM user_plants WHERE user_id=%s ORDER BY planted_date DESC;"
        params = (user_id,)
        results = execute_query(query, params=params, fetch_all=True)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add a new plant
@plant_db_bp.route('/<int:user_id>', methods=['POST'])
def add_user_plant(user_id):
    try:
        data = request.json
        plant_name = data.get('plant_name')
        variety = data.get('variety')
        planted_date = data.get('planted_date')
        health_status = data.get('health_status', 'good')
        image_url = data.get('image_url')
        notes = data.get('notes')
        query = '''
        INSERT INTO user_plants (user_id, plant_name, variety, planted_date, health_status, image_url, notes, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        '''
        params = (user_id, plant_name, variety, planted_date, health_status, image_url, notes, datetime.now())
        plant_id = execute_query(query, params=params, commit=True)
        return jsonify({'success': True, 'message': 'Plant added', 'plant_id': plant_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update health status of a plant
@plant_db_bp.route('/<int:user_id>/<int:plant_id>', methods=['PATCH'])
def update_health(user_id, plant_id):
    try:
        data = request.json
        health_status = data.get('health_status')
        query = "UPDATE user_plants SET health_status=%s WHERE id=%s AND user_id=%s"
        params = (health_status, plant_id, user_id)
        execute_query(query, params=params, commit=True)
        return jsonify({'success': True, 'message': 'Health status updated'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete a plant
@plant_db_bp.route('/<int:user_id>/<int:plant_id>', methods=['DELETE'])
def delete_user_plant(user_id, plant_id):
    try:
        query = "DELETE FROM user_plants WHERE id=%s AND user_id=%s"
        params = (plant_id, user_id)
        execute_query(query, params=params, commit=True)
        return jsonify({'success': True, 'message': 'Plant deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Attach to app:
#   from plant_db_routes import plant_db_bp
#   app.register_blueprint(plant_db_bp)
