# Phase 5: Expert Validation + B2B API Routes
# Flask endpoints for agronomist marketplace, consultations, and B2B API

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime, timedelta
import uuid
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import hashlib
import hmac
from functools import wraps

# Initialize Blueprint
phase5_bp = Blueprint('phase5', __name__, url_prefix='/api/v1')

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT', 5432)
    )
    return conn

# =============================================================================
# AGRONOMIST REGISTRATION & PROFILE MANAGEMENT
# =============================================================================

@phase5_bp.route('/agronomists/register', methods=['POST'])
@cross_origin()
def register_agronomist():
    """
    Register as an agronomist (expert)
    POST /agronomists/register
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        full_name = data.get('full_name')
        email = data.get('email')
        phone = data.get('phone')
        location_lat = data.get('location_lat')
        location_long = data.get('location_long')
        specializations = data.get('specializations', [])  # Array
        years_experience = data.get('years_experience')
        qualification = data.get('qualification')
        bio = data.get('bio')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        agronomist_id = str(uuid.uuid4())

        # Check if user already registered as agronomist
        cur.execute('SELECT id FROM agronomists WHERE user_id = %s', (user_id,))
        if cur.fetchone():
            return jsonify({'error': 'User already registered as agronomist'}), 400

        # Insert agronomist record
        cur.execute("""
            INSERT INTO agronomists (
                id, user_id, full_name, email, phone, location_lat, location_long,
                specializations, years_experience, qualification, bio, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
            RETURNING id, full_name, email, status, rating, created_at
        """, (
            agronomist_id, user_id, full_name, email, phone, location_lat,
            location_long, specializations, years_experience, qualification, bio
        ))

        result = cur.fetchone()
        conn.commit()

        # Update users table to mark as agronomist
        cur.execute('UPDATE users SET is_agronomist = TRUE WHERE id = %s', (user_id,))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'message': 'Agronomist registration successful',
            'agronomist': dict(result)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@phase5_bp.route('/agronomists/<agronomist_id>/profile', methods=['GET'])
@cross_origin()
def get_agronomist_profile(agronomist_id):
    """
    Get agronomist profile with stats
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT id, full_name, email, phone, location_name, location_lat, location_long,
                   specializations, years_experience, qualification, bio, verified, rating,
                   total_ratings, total_consultations, status, registration_date, last_active
            FROM agronomists
            WHERE id = %s
        """, (agronomist_id,))

        result = cur.fetchone()
        cur.close()
        conn.close()

        if not result:
            return jsonify({'error': 'Agronomist not found'}), 404

        return jsonify(dict(result)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# DIAGNOSTIC REPORTS (99 INR - AI-POWERED)
# =============================================================================

@phase5_bp.route('/reports/generate', methods=['POST'])
@cross_origin()
def generate_diagnostic_report():
    """
    Generate AI-powered diagnostic report (99 INR)
    POST /reports/generate
    Body: {
        "user_id": "uuid",
        "plant_id": "uuid",
        "image_url": "url",
        "ai_diagnosis": {...},
        "internet_sources": [],
        "community_tips_references": []
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        plant_id = data.get('plant_id')
        image_url = data.get('image_url')
        ai_diagnosis = data.get('ai_diagnosis', {})
        internet_sources = data.get('internet_sources', [])
        community_tips = data.get('community_tips_references', [])

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        report_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=30)

        # Create image hash
        image_hash = hashlib.sha256(image_url.encode()).hexdigest()[:16]

        # Insert diagnostic report
        cur.execute("""
            INSERT INTO diagnostic_reports (
                id, user_id, plant_id, image_url, image_secure_hash,
                ai_diagnosis, detailed_analysis, internet_sources,
                community_tips_references, report_status, price_inr,
                purchased_at, expires_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed', 99,
                      CURRENT_TIMESTAMP, %s)
            RETURNING id, price_inr, purchased_at, expires_at
        """, (
            report_id, user_id, plant_id, image_url, image_hash,
            json.dumps(ai_diagnosis), json.dumps({  # detailed_analysis
                'symptoms': ai_diagnosis.get('symptoms', []),
                'severity': ai_diagnosis.get('severity', 'low'),
                'treatment_timeline_days': ai_diagnosis.get('treatment_timeline', 7),
                'organic_options': internet_sources[:3],
                'community_advice': len(community_tips)
            }),
            internet_sources, community_tips, expires_at
        ))

        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'message': 'Diagnostic report generated',
            'report': dict(result),
            'report_id': report_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# CONSULTATION BOOKING & FIFO QUEUE
# =============================================================================

@phase5_bp.route('/consultations/request', methods=['POST'])
@cross_origin()
def request_consultation():
    """
    Request expert consultation (299 INR)
    POST /consultations/request
    Body: {
        "user_id": "uuid",
        "report_id": "uuid",
        "user_description": "string",
        "user_location_lat": float,
        "user_location_long": float
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        report_id = data.get('report_id')
        user_description = data.get('user_description')
        user_lat = data.get('user_location_lat')
        user_long = data.get('user_location_long')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        consultation_id = str(uuid.uuid4())

        # Get next queue position
        cur.execute('SELECT COUNT(*) as count FROM expert_consultations WHERE status = %s', ('pending',))
        queue_position = cur.fetchone()['count'] + 1

        # Create consultation request
        cur.execute("""
            INSERT INTO expert_consultations (
                id, user_id, report_id, status, price_inr, queue_position,
                user_location_lat, user_location_long, user_description,
                request_type
            ) VALUES (%s, %s, %s, 'pending', 299, %s, %s, %s, %s, 'chat')
            RETURNING id, status, queue_position, price_inr, requested_at
        """, (consultation_id, user_id, report_id, queue_position, user_lat, user_long, user_description))

        result = cur.fetchone()
        conn.commit()

        # Notify available agronomists (in FIFO order)
        cur.execute("""
            SELECT id, location_lat, location_long FROM agronomists
            WHERE status = 'active' AND verified = TRUE
            ORDER BY last_active DESC
            LIMIT 5
        """)
        agronomists = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify({
            'message': 'Consultation request created',
            'consultation': dict(result),
            'queue_position': queue_position,
            'available_agronomists_count': len(agronomists)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@phase5_bp.route('/consultations/available-queue', methods=['GET'])
@cross_origin()
def get_available_queue():
    """
    Get next pending consultation in FIFO queue for an agronomist
    GET /consultations/available-queue?agronomist_id=uuid
    """
    try:
        agronomist_id = request.args.get('agronomist_id')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Get FIFO next pending consultation
        cur.execute("""
            SELECT id, user_id, report_id, price_inr, user_description,
                   user_location_lat, user_location_long, requested_at, queue_position
            FROM expert_consultations
            WHERE status = 'pending' AND agronomist_id IS NULL
            ORDER BY requested_at ASC, queue_position ASC
            LIMIT 1
        """)

        result = cur.fetchone()
        cur.close()
        conn.close()

        if not result:
            return jsonify({
                'message': 'No pending consultations',
                'consultation': None
            }), 200

        return jsonify({
            'message': 'Next consultation in queue',
            'consultation': dict(result)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@phase5_bp.route('/consultations/<consultation_id>/accept', methods=['POST'])
@cross_origin()
def accept_consultation(consultation_id):
    """
    Agronomist accepts consultation from queue
    POST /consultations/{id}/accept
    Body: {"agronomist_id": "uuid"}
    """
    try:
        data = request.json
        agronomist_id = data.get('agronomist_id')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Update consultation status
        cur.execute("""
            UPDATE expert_consultations
            SET status = 'in_progress', agronomist_id = %s, accepted_at = CURRENT_TIMESTAMP
            WHERE id = %s AND status = 'pending'
            RETURNING id, status, agronomist_id, accepted_at
        """, (agronomist_id, consultation_id))

        result = cur.fetchone()
        conn.commit()

        if not result:
            conn.close()
            return jsonify({'error': 'Consultation not found or already accepted'}), 404

        conn.close()

        return jsonify({
            'message': 'Consultation accepted',
            'consultation': dict(result)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =============================================================================
# CHAT & MESSAGING
# =============================================================================

@phase5_bp.route('/consultations/<consultation_id>/messages', methods=['POST'])
@cross_origin()
def send_message(consultation_id):
    """
    Send message in consultation chat
    POST /consultations/{id}/messages
    Body: {"sender_id": "uuid", "sender_role": "user|agronomist", "message_text": "string"}
    """
    try:
        data = request.json
        sender_id = data.get('sender_id')
        sender_role = data.get('sender_role')  # 'user' or 'agronomist'
        message_text = data.get('message_text')
        image_urls = data.get('image_urls', [])

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        message_id = str(uuid.uuid4())

        cur.execute("""
            INSERT INTO consultation_messages (
                id, consultation_id, sender_id, sender_role, message_text, image_urls
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at, sender_role
        """, (message_id, consultation_id, sender_id, sender_role, message_text, image_urls))

        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'message': 'Message sent',
            'message_data': dict(result)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@phase5_bp.route('/consultations/<consultation_id>/messages', methods=['GET'])
@cross_origin()
def get_chat_history(consultation_id):
    """
    Get chat history for consultation
    GET /consultations/{id}/messages
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT id, sender_id, sender_role, message_text, image_urls, 
                   created_at, is_read
            FROM consultation_messages
            WHERE consultation_id = %s
            ORDER BY created_at ASC
        """, (consultation_id,))

        messages = cur.fetchall()

        # Mark messages as read
        cur.execute("""
            UPDATE consultation_messages
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE consultation_id = %s AND is_read = FALSE
        """, (consultation_id,))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'consultation_id': consultation_id,
            'messages': [dict(msg) for msg in messages],
            'total_messages': len(messages)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# CONSULTATION COMPLETION & RATINGS
# =============================================================================

@phase5_bp.route('/consultations/<consultation_id>/complete', methods=['POST'])
@cross_origin()
def complete_consultation(consultation_id):
    """
    Mark consultation as complete and create earnings record
    POST /consultations/{id}/complete
    Body: {"user_rating": 1-5, "user_feedback": "string"}
    """
    try:
        data = request.json
        user_rating = data.get('user_rating')
        user_feedback = data.get('user_feedback')

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Get consultation details
        cur.execute("""
            SELECT agronomist_id, price_inr FROM expert_consultations WHERE id = %s
        """, (consultation_id,))
        consultation = cur.fetchone()

        if not consultation:
            conn.close()
            return jsonify({'error': 'Consultation not found'}), 404

        agronomist_id = consultation['agronomist_id']
        price_inr = consultation['price_inr']

        # Update consultation status
        cur.execute("""
            UPDATE expert_consultations
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
                user_rating = %s, user_feedback = %s
            WHERE id = %s
            RETURNING id, status
        """, (user_rating, user_feedback, consultation_id))

        conn.commit()

        # Create earning record (70% to agronomist, 30% to platform)
        earned_amount_inr = int(price_inr * 0.70)
        earning_id = str(uuid.uuid4())

        cur.execute("""
            INSERT INTO agronomist_earnings (
                id, agronomist_id, consultation_id, earned_amount_inr,
                commission_percentage, payout_status
            ) VALUES (%s, %s, %s, %s, 70, 'pending')
            RETURNING id, earned_amount_inr, payout_status
        """, (earning_id, agronomist_id, consultation_id, earned_amount_inr))

        earning = cur.fetchone()
        conn.commit()

        # Update agronomist stats
        cur.execute("""
            UPDATE agronomists
            SET total_consultations = total_consultations + 1,
                rating = (total_ratings * rating + %s) / (total_ratings + 1),
                total_ratings = total_ratings + 1
            WHERE id = %s
        """, (user_rating, agronomist_id))
        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            'message': 'Consultation completed',
            'earning': dict(earning),
            'earning_id': earning_id
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# AGRONOMIST EARNINGS DASHBOARD
# =============================================================================

@phase5_bp.route('/agronomists/<agronomist_id>/earnings', methods=['GET'])
@cross_origin()
def get_agronomist_earnings(agronomist_id):
    """
    Get earnings summary for agronomist
    GET /agronomists/{id}/earnings
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Total earnings
        cur.execute("""
            SELECT 
                SUM(earned_amount_inr) as total_earned,
                COUNT(*) as total_consultations,
                SUM(CASE WHEN payout_status = 'pending' THEN earned_amount_inr ELSE 0 END) as pending_payout,
                SUM(CASE WHEN payout_status = 'paid' THEN earned_amount_inr ELSE 0 END) as paid_amount
            FROM agronomist_earnings
            WHERE agronomist_id = %s
        """, (agronomist_id,))

        stats = cur.fetchone()

        # Recent earnings
        cur.execute("""
            SELECT ae.id, ae.consultation_id, ae.earned_amount_inr, 
                   ae.payout_status, ae.created_at, ae.payout_date
            FROM agronomist_earnings ae
            WHERE ae.agronomist_id = %s
            ORDER BY ae.created_at DESC
            LIMIT 20
        """, (agronomist_id,))

        recent = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify({
            'agronomist_id': agronomist_id,
            'summary': dict(stats) if stats else {},
            'recent_earnings': [dict(e) for e in recent]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# B2B API - RATE LIMITING & AUTHENTICATION
# =============================================================================

def validate_api_key(f):
    """Decorator to validate B2B API key"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        api_secret = request.headers.get('X-API-Secret')

        if not api_key or not api_secret:
            return jsonify({'error': 'Missing API credentials'}), 401

        try:
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)

            cur.execute("""
                SELECT id, tier, requests_per_day, status FROM b2b_api_keys
                WHERE api_key = %s AND api_secret = %s AND status = 'active'
            """, (api_key, api_secret))

            api_client = cur.fetchone()
            cur.close()
            conn.close()

            if not api_client:
                return jsonify({'error': 'Invalid API credentials'}), 401

            return f(api_client, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return decorated_function


@phase5_bp.route('/b2b/diagnosis', methods=['POST'])
@cross_origin()
@validate_api_key
def b2b_get_diagnosis(api_client):
    """
    B2B API endpoint for plant diagnosis
    POST /b2b/diagnosis
    Headers: X-API-Key, X-API-Secret
    Body: {"image_url": "url", "plant_id": "uuid"}
    """
    try:
        data = request.json
        image_url = data.get('image_url')
        plant_id = data.get('plant_id')

        # Log API usage
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            INSERT INTO api_usage_logs (
                api_key_id, endpoint, method, status_code, request_count
            ) VALUES (%s, '/b2b/diagnosis', 'POST', 200, 1)
        """, (api_client['id'],))

        conn.commit()

        # Run diagnosis (mock for now)
        diagnosis_result = {
            'disease_detected': 'Early Blight',
            'confidence': 0.87,
            'severity': 'medium',
            'plant': plant_id,
            'treatment_options': ['Organic fungicide', 'Chemical treatment'],
            'timestamp': datetime.utcnow().isoformat()
        }

        cur.execute("""
            UPDATE b2b_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = %s
        """, (api_client['id'],))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'status': 'success',
            'diagnosis': diagnosis_result,
            'tier': api_client['tier']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@phase5_bp.route('/b2b/health', methods=['GET'])
@cross_origin()
def b2b_health_check():
    """
    B2B API health check (no auth required)
    """
    return jsonify({
        'status': 'operational',
        'version': '1.0',
        'endpoints': {
            'diagnosis': '/b2b/diagnosis',
            'agronomists': '/agronomists',
            'consultations': '/consultations'
        }
    }), 200
