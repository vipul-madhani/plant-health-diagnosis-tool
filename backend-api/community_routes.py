from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime
import mysql.connector
from email_notifications import send_email

community_bp = Blueprint('community', __name__, url_prefix='/api/community')

# Database connection helper
def get_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='password',
        database='plant_health_db'
    )

# ============ USER CONTRIBUTIONS (Farmers/Users) ============

@community_bp.route('/contributions/submit', methods=['POST'])
@cross_origin()
def submit_user_contribution():
    """
    Users submit their experiences/solutions
    - Share farming experiences
    - Report issue resolutions
    - Earn points for community engagement
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        contribution_type = data.get('type')
        content = data.get('content')
        related_consultation_id = data.get('consultation_id')
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("""
            INSERT INTO community_contributions 
            (user_id, contributor_tier, contribution_type, content, related_consultation_id, 
             status, created_at, likes, views)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, 'user', contribution_type, content, related_consultation_id, 
              'pending_review', datetime.now(), 0, 0))
        
        contribution_id = cursor.lastrowid
        db.commit()
        
        send_email(
            to='admin@planthealth.com',
            subject='New Community Contribution Requires Review',
            body=f'User {user_id} submitted a {contribution_type} contribution for review.'
        )
        
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Contribution submitted for review',
            'contribution_id': contribution_id,
            'points_pending': 10
        }), 201
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@community_bp.route('/contributions/<int:contribution_id>/like', methods=['POST'])
@cross_origin()
def like_contribution(contribution_id):
    """Users can like community contributions"""
    try:
        data = request.json
        user_id = data.get('user_id')
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute(
            "SELECT * FROM contribution_likes WHERE contribution_id=%s AND user_id=%s",
            (contribution_id, user_id)
        )
        
        if cursor.fetchone():
            return jsonify({'status': 'error', 'message': 'Already liked'}), 400
        
        cursor.execute("""
            INSERT INTO contribution_likes (contribution_id, user_id, created_at)
            VALUES (%s, %s, %s)
        """, (contribution_id, user_id, datetime.now()))
        
        cursor.execute(
            "UPDATE community_contributions SET likes = likes + 1 WHERE id = %s",
            (contribution_id,)
        )
        
        db.commit()
        cursor.close()
        db.close()
        
        return jsonify({'status': 'success', 'message': 'Contribution liked'}), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@community_bp.route('/contributions/feed', methods=['GET'])
@cross_origin()
def get_community_feed():
    """Get community feed with approved contributions"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = 20
        offset = (page - 1) * limit
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT cc.*, u.name as user_name, u.profile_pic,
                   COUNT(cl.id) as total_likes
            FROM community_contributions cc
            LEFT JOIN users u ON cc.user_id = u.id
            LEFT JOIN contribution_likes cl ON cc.id = cl.contribution_id
            WHERE cc.status = 'published'
            GROUP BY cc.id
            ORDER BY cc.likes DESC, cc.created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        
        contributions = cursor.fetchall()
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'contributions': contributions,
            'page': page,
            'total': len(contributions)
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ============ AGRONOMIST VALIDATIONS ============

@community_bp.route('/solutions/validate', methods=['POST'])
@cross_origin()
def validate_solution():
    """Agronomists validate solutions from consultations"""
    try:
        data = request.json
        agronomist_id = data.get('agronomist_id')
        contribution_id = data.get('contribution_id')
        validation_status = data.get('status')
        notes = data.get('notes')
        effectiveness_score = data.get('effectiveness_score')
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("""
            INSERT INTO agronomist_validations 
            (agronomist_id, contribution_id, status, notes, effectiveness_score, validated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (agronomist_id, contribution_id, validation_status, notes, 
              effectiveness_score, datetime.now()))
        
        validation_id = cursor.lastrowid
        
        if validation_status == 'validated' and effectiveness_score >= 80:
            cursor.execute(
                "UPDATE community_contributions SET status='approved' WHERE id=%s",
                (contribution_id,)
            )
        
        db.commit()
        
        cursor.execute(
            "SELECT COUNT(*) as count FROM agronomist_validations WHERE agronomist_id=%s",
            (agronomist_id,)
        )
        count = cursor.fetchone()[0]
        
        if count % 10 == 0:
            cursor.execute("""
                INSERT INTO agronomist_badges 
                (agronomist_id, badge_type, awarded_at)
                VALUES (%s, %s, %s)
            """, (agronomist_id, 'validator_expert', datetime.now()))
            db.commit()
            
            send_email(
                to=f'agronomist_{agronomist_id}@planthealth.com',
                subject='Badge Earned: Validator Expert',
                body='You earned Validator Expert badge for 10 validations!'
            )
        
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Solution validated',
            'validation_id': validation_id
        }), 201
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ============ ADMIN MODERATION ============

@community_bp.route('/admin/contributions/pending', methods=['GET'])
@cross_origin()
def get_pending_contributions():
    """Get contributions pending admin review"""
    try:
        admin_id = request.args.get('admin_id', type=int)
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT cc.*, u.name as user_name
            FROM community_contributions cc
            LEFT JOIN users u ON cc.user_id = u.id
            WHERE cc.status IN ('pending_review', 'needs_revision')
            ORDER BY cc.created_at ASC
        """)
        
        contributions = cursor.fetchall()
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'pending_count': len(contributions),
            'contributions': contributions
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@community_bp.route('/admin/contributions/<int:contribution_id>/review', methods=['POST'])
@cross_origin()
def review_contribution(contribution_id):
    """Admin reviews and approves/rejects contributions"""
    try:
        data = request.json
        admin_id = data.get('admin_id')
        decision = data.get('decision')
        feedback = data.get('feedback')
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM community_contributions WHERE id=%s", (contribution_id,))
        contribution = cursor.fetchone()
        
        if not contribution:
            return jsonify({'status': 'error', 'message': 'Contribution not found'}), 404
        
        if decision == 'approve':
            new_status = 'published'
            cursor.execute(
                "UPDATE users SET community_points = community_points + %s WHERE id = %s",
                (25, contribution['user_id'])
            )
            message = 'Your contribution was approved and published!'
            
        elif decision == 'reject':
            new_status = 'rejected'
            message = f'Your contribution was rejected. Reason: {feedback}'
            
        elif decision == 'request_revision':
            new_status = 'needs_revision'
            message = f'Your contribution needs revision: {feedback}'
        
        cursor.execute(
            "UPDATE community_contributions SET status=%s WHERE id=%s",
            (new_status, contribution_id)
        )
        
        cursor.execute("""
            INSERT INTO admin_moderation_logs 
            (admin_id, contribution_id, action, feedback, actioned_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (admin_id, contribution_id, decision, feedback, datetime.now()))
        
        db.commit()
        
        send_email(
            to=f'user_{contribution["user_id"]}@planthealth.com',
            subject='Community Contribution Review Update',
            body=message
        )
        
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Contribution reviewed',
            'new_status': new_status
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@community_bp.route('/admin/collections/create', methods=['POST'])
@cross_origin()
def create_seasonal_collection():
    """Admin creates seasonal/thematic collections"""
    try:
        data = request.json
        admin_id = data.get('admin_id')
        title = data.get('title')
        description = data.get('description')
        season = data.get('season')
        region = data.get('region')
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("""
            INSERT INTO content_collections 
            (admin_id, title, description, season, region, created_at, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (admin_id, title, description, season, region, datetime.now(), 'active'))
        
        collection_id = cursor.lastrowid
        db.commit()
        
        send_email(
            to='admin@planthealth.com',
            subject=f'New Collection Created: {title}',
            body=f'Admin {admin_id} created collection: {title}'
        )
        
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'message': 'Collection created',
            'collection_id': collection_id
        }), 201
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@community_bp.route('/admin/collections/<int:collection_id>/add-content', methods=['POST'])
@cross_origin()
def add_content_to_collection(collection_id):
    """Admin adds approved content to collections"""
    try:
        data = request.json
        admin_id = data.get('admin_id')
        contribution_ids = data.get('contribution_ids')
        
        db = get_db()
        cursor = db.cursor()
        
        for contrib_id in contribution_ids:
            cursor.execute("""
                INSERT INTO collection_contents 
                (collection_id, contribution_id, added_by_admin, added_at)
                VALUES (%s, %s, %s, %s)
            """, (collection_id, contrib_id, admin_id, datetime.now()))
        
        db.commit()
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'message': f'Added {len(contribution_ids)} items to collection'
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@community_bp.route('/collections/<int:collection_id>', methods=['GET'])
@cross_origin()
def get_collection(collection_id):
    """Get a specific collection with all its content"""
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        cursor.execute(
            "SELECT * FROM content_collections WHERE id=%s",
            (collection_id,)
        )
        collection = cursor.fetchone()
        
        if not collection:
            return jsonify({'status': 'error', 'message': 'Collection not found'}), 404
        
        cursor.execute("""
            SELECT cc.* FROM community_contributions cc
            JOIN collection_contents ct ON cc.id = ct.contribution_id
            WHERE ct.collection_id=%s AND cc.status='published'
            ORDER BY ct.added_at DESC
        """, (collection_id,))
        
        contents = cursor.fetchall()
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'collection': collection,
            'contents': contents,
            'total_items': len(contents)
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@community_bp.route('/collections', methods=['GET'])
@cross_origin()
def list_collections():
    """Get all active seasonal/regional collections"""
    try:
        season = request.args.get('season')
        region = request.args.get('region')
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        query = "SELECT * FROM content_collections WHERE status='active'"
        params = []
        
        if season:
            query += " AND season=%s"
            params.append(season)
        
        if region:
            query += " AND region=%s"
            params.append(region)
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        collections = cursor.fetchall()
        
        cursor.close()
        db.close()
        
        return jsonify({
            'status': 'success',
            'collections': collections,
            'total': len(collections)
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
