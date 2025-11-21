from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

@stats_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_stats(user_id):
    try:
        # Get plants analyzed, active plants, consultations completed, total spent
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Attach to app:
#   from stats_user_routes import stats_bp
#   app.register_blueprint(stats_bp)
