from jwt_decorators import jwt_required_role
from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query

dashboard_bp = Blueprint('secure_dashboard', __name__, url_prefix='/api/secure/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required_role(['user','agronomist','admin'])
def secure_user_stats():
    user = getattr(request, 'user', {})
    user_id = user.get('user_id')
    # Aggregate stats only for self
    stats_query = '''
        SELECT 
            (SELECT COUNT(*) FROM user_plants WHERE user_id=%s) AS plants_analyzed,
            (SELECT COUNT(*) FROM consultations WHERE user_id=%s) AS consultations,
            (SELECT COUNT(*) FROM user_plants WHERE user_id=%s AND health_status IN ('good','excellent')) AS active_plants,
            (SELECT IFNULL(SUM(amount),0) FROM payments WHERE user_id=%s AND status='paid') AS total_spent
        '''
    params = (user_id, user_id, user_id, user_id)
    stats = execute_query(stats_query, params=params, fetch_one=True)
    return jsonify({'success': True, 'data': stats}), 200

@dashboard_bp.route('/activity', methods=['GET'])
@jwt_required_role(['user','agronomist','admin'])
def secure_user_activity():
    user = getattr(request, 'user', {})
    user_id = user.get('user_id')
    query = '''SELECT id, activity_type, reference_id, description, created_at FROM user_activity_log WHERE user_id=%s ORDER BY created_at DESC LIMIT 20;'''
    results = execute_query(query, params=(user_id,), fetch_all=True)
    return jsonify({'success': True, 'data': results}), 200
