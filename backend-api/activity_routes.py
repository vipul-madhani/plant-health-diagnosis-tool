from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query
from datetime import datetime

activity_bp = Blueprint('activity', __name__, url_prefix='/api/activity')

# Get user's recent dashboard activity
@activity_bp.route('/<int:user_id>', methods=['GET'])
def get_user_activity(user_id):
    try:
        query = '''
        SELECT a.id, a.activity_type, a.reference_id, a.description, a.created_at
        FROM user_activity_log a
        WHERE a.user_id = %s
        ORDER BY a.created_at DESC
        LIMIT 20
        '''
        params = (user_id,)
        results = execute_query(query, params=params, fetch_all=True)
        return jsonify({'success': True, 'data': results}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# POST: Add activity log (diagnosis, consultation, payment, plant_added, etc)
@activity_bp.route('/<int:user_id>', methods=['POST'])
def add_user_activity(user_id):
    try:
        data = request.json
        activity_type = data.get('activity_type')
        reference_id = data.get('reference_id')
        description = data.get('description')
        query = '''
        INSERT INTO user_activity_log (user_id, activity_type, reference_id, description, created_at)
        VALUES (%s, %s, %s, %s, %s)
        '''
        params = (user_id, activity_type, reference_id, description, datetime.now())
        act_id = execute_query(query, params=params, commit=True)
        return jsonify({'success': True, 'activity_id': act_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Attach to app:
#   from activity_routes import activity_bp
#   app.register_blueprint(activity_bp)
