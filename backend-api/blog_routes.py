"""Blog Routes - Educational content with effectiveness metrics and engagement"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import sqlite3
import uuid
from email_notifications import send_email_notification

blog_bp = Blueprint('blog', __name__, url_prefix='/api/blog')
DB_PATH = 'database.db'

# Minimum effectiveness score for blog publishing (80%)
MIN_EFFECTIVENESS_SCORE = 0.80

@blog_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_blog_post():
    """Submit a new blog post (agronomist only)"""
    try:
        agronomist_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate input
        required_fields = ['title', 'content', 'region', 'season']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verify agronomist
        cursor.execute('SELECT id, name FROM users WHERE id = ? AND role = "agronomist"', (agronomist_id,))
        agronomist = cursor.fetchone()
        
        if not agronomist:
            conn.close()
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Create blog post
        blog_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO blog_posts (id, agronomist_id, title, content, region, season, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        ''', (
            blog_id, agronomist_id, data.get('title'), data.get('content'),
            data.get('region'), data.get('season'), datetime.utcnow()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'blog_id': blog_id,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/list', methods=['GET'])
def get_blog_posts():
    """Get published blog posts"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        region = request.args.get('region')
        season = request.args.get('season')
        
        query = '''
            SELECT id, agronomist_id, title, content, region, season, 
                   status, effectiveness_score, created_at
            FROM blog_posts 
            WHERE status = 'published'
        '''
        params = []
        
        if region:
            query += ' AND region = ?'
            params.append(region)
        
        if season:
            query += ' AND season = ?'
            params.append(season)
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        posts = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'blog_posts': [
                {
                    'blog_id': p[0],
                    'agronomist_id': p[1],
                    'title': p[2],
                    'content': p[3],
                    'region': p[4],
                    'season': p[5],
                    'status': p[6],
                    'effectiveness_score': p[7],
                    'created_at': p[8]
                }
                for p in posts
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/<blog_id>/engage', methods=['POST'])
@jwt_required()
def engage_with_post(blog_id):
    """Track engagement with blog post (view, helpful, share)"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        engagement_type = data.get('type')  # 'view', 'helpful', 'share'
        
        if engagement_type not in ['view', 'helpful', 'share']:
            return jsonify({'error': 'Invalid engagement type'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if blog exists
        cursor.execute('SELECT id, agronomist_id FROM blog_posts WHERE id = ?', (blog_id,))
        blog = cursor.fetchone()
        
        if not blog:
            conn.close()
            return jsonify({'error': 'Blog post not found'}), 404
        
        # Record engagement
        engagement_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO blog_engagement (id, blog_id, user_id, engagement_type, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (engagement_id, blog_id, user_id, engagement_type, datetime.utcnow()))
        
        # Update blog post effectiveness score
        cursor.execute('''
            SELECT COUNT(*) FROM blog_engagement 
            WHERE blog_id = ? AND engagement_type IN ('helpful', 'share')
        ''', (blog_id,))
        positive_engagements = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT COUNT(*) FROM blog_engagement WHERE blog_id = ?
        ''', (blog_id,))
        total_engagements = cursor.fetchone()[0]
        
        effectiveness_score = positive_engagements / total_engagements if total_engagements > 0 else 0
        
        cursor.execute('''
            UPDATE blog_posts SET effectiveness_score = ? WHERE id = ?
        ''', (effectiveness_score, blog_id))
        
        # If score >= 80%, auto-publish
        if effectiveness_score >= MIN_EFFECTIVENESS_SCORE:
            cursor.execute('''
                UPDATE blog_posts SET status = 'published' WHERE id = ? AND status = 'pending'
            ''', (blog_id,))
            
            # Send notification to agronomist
            cursor.execute('SELECT email FROM users WHERE id = ?', (blog[1],))
            agronomist_email = cursor.fetchone()
            
            if agronomist_email:
                send_email_notification(
                    agronomist_email[0],
                    'Blog Post Published',
                    f'Your blog post has been automatically published! Effectiveness score: {effectiveness_score*100:.1f}%'
                )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'engagement_id': engagement_id,
            'blog_id': blog_id,
            'engagement_type': engagement_type,
            'effectiveness_score': effectiveness_score
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/<blog_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(blog_id):
    """Add comment to blog post"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('comment'):
            return jsonify({'error': 'Comment cannot be empty'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check blog exists
        cursor.execute('SELECT id FROM blog_posts WHERE id = ?', (blog_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Blog post not found'}), 404
        
        # Insert comment
        comment_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO blog_comments (id, blog_id, user_id, comment, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (comment_id, blog_id, user_id, data.get('comment'), datetime.utcnow()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'comment_id': comment_id,
            'blog_id': blog_id,
            'created_at': datetime.utcnow().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/<blog_id>/comments', methods=['GET'])
def get_comments(blog_id):
    """Get comments for blog post"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        cursor.execute('''
            SELECT id, user_id, comment, created_at FROM blog_comments 
            WHERE blog_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (blog_id, limit, offset))
        
        comments = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'blog_id': blog_id,
            'comments': [
                {
                    'comment_id': c[0],
                    'user_id': c[1],
                    'comment': c[2],
                    'created_at': c[3]
                }
                for c in comments
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@blog_bp.route('/agronomist/posts', methods=['GET'])
@jwt_required()
def get_my_posts():
    """Get all posts by logged-in agronomist"""
    try:
        agronomist_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        cursor.execute('''
            SELECT id, title, region, season, status, effectiveness_score, created_at
            FROM blog_posts 
            WHERE agronomist_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (agronomist_id, limit, offset))
        
        posts = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'blog_posts': [
                {
                    'blog_id': p[0],
                    'title': p[1],
                    'region': p[2],
                    'season': p[3],
                    'status': p[4],
                    'effectiveness_score': p[5],
                    'created_at': p[6]
                }
                for p in posts
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
