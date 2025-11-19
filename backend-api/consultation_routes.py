"""Consultation Routes - FIFO matching and consultation management"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import sqlite3
import uuid
from email_notifications import send_email_notification

consultation_bp = Blueprint('consultation', __name__, url_prefix='/api/consultation')
DB_PATH = 'database.db'

# FIFO consultation matching - NO RATING BIAS
def get_available_agronomist():
    """Get next available agronomist (FIFO - First In, First Out)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get agronomist with least consultations (FIFO)
        # This ensures fair distribution without rating bias
        cursor.execute('''
            SELECT users.id, users.name, users.email
            FROM users
            WHERE users.role = 'agronomist' AND users.is_verified = 1
            GROUP BY users.id
            ORDER BY COUNT(consultations.id) ASC, users.id ASC
            LIMIT 1
        ''')
        
        agronomist = cursor.fetchone()
        conn.close()
        
        return agronomist
    except Exception as e:
        print(f"Error getting agronomist: {str(e)}")
        return None

@consultation_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_consultation():
    """Submit a new consultation request"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate input
        required_fields = ['plant_image', 'description', 'region', 'season']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get available agronomist (FIFO)
        agronomist = get_available_agronomist()
        if not agronomist:
            return jsonify({'error': 'No agronomists available'}), 503
        
        agronomist_id, agronomist_name, agronomist_email = agronomist
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create consultation
        consultation_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO consultations 
            (id, user_id, agronomist_id, plant_image_url, description, region, season, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        ''', (
            consultation_id, user_id, agronomist_id, 
            data.get('plant_image'), data.get('description'),
            data.get('region'), data.get('season'),
            datetime.utcnow()
        ))
        
        conn.commit()
        
        # Get user info for notification
        cursor.execute('SELECT email, name FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        # Send notifications
        if user:
            send_email_notification(
                user[0],
                'Consultation Submitted',
                f'Your consultation has been submitted and assigned to {agronomist_name}. Consultation ID: {consultation_id}'
            )
        
        send_email_notification(
            agronomist_email,
            f'New Consultation Assigned',
            f'You have been assigned a new consultation (ID: {consultation_id}) on {data.get("season")} in {data.get("region")}. Plant issue: {data.get("description")}'
        )
        
        return jsonify({
            'consultation_id': consultation_id,
            'status': 'pending',
            'assigned_agronomist': agronomist_name,
            'created_at': datetime.utcnow().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consultation_bp.route('/<consultation_id>/diagnosis', methods=['POST'])
@jwt_required()
def submit_diagnosis(consultation_id):
    """Submit diagnosis for a consultation"""
    try:
        agronomist_id = get_jwt_identity()
        data = request.get_json()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verify agronomist owns this consultation
        cursor.execute('''
            SELECT id, user_id, status FROM consultations WHERE id = ? AND agronomist_id = ?
        ''', (consultation_id, agronomist_id))
        
        consultation = cursor.fetchone()
        if not consultation:
            conn.close()
            return jsonify({'error': 'Consultation not found or unauthorized'}), 404
        
        if consultation[2] != 'pending':
            conn.close()
            return jsonify({'error': 'Consultation already has diagnosis'}), 400
        
        # Update consultation with diagnosis
        cursor.execute('''
            UPDATE consultations 
            SET status = 'diagnosed', diagnosis = ?, remedies = ?, diagnosed_at = ?
            WHERE id = ?
        ''', (
            data.get('diagnosis'),
            data.get('remedies'),
            datetime.utcnow(),
            consultation_id
        ))
        
        conn.commit()
        
        # Notify user
        cursor.execute('SELECT email FROM users WHERE id = ?', (consultation[1],))
        user_email = cursor.fetchone()
        conn.close()
        
        if user_email:
            send_email_notification(
                user_email[0],
                'Diagnosis Ready',
                f'Your consultation diagnosis is ready! Diagnosis: {data.get("diagnosis")}. Remedies: {data.get("remedies")}'
            )
        
        return jsonify({
            'consultation_id': consultation_id,
            'status': 'diagnosed',
            'diagnosed_at': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consultation_bp.route('/<consultation_id>', methods=['GET'])
@jwt_required()
def get_consultation(consultation_id):
    """Get consultation details"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, user_id, agronomist_id, plant_image_url, description, region, season, 
                   status, diagnosis, remedies, created_at, diagnosed_at
            FROM consultations WHERE id = ?
        ''', (consultation_id,))
        
        consultation = cursor.fetchone()
        
        if not consultation:
            conn.close()
            return jsonify({'error': 'Consultation not found'}), 404
        
        # Verify user is authorized
        if user_id != consultation[1] and user_id != consultation[2]:
            conn.close()
            return jsonify({'error': 'Unauthorized'}), 403
        
        conn.close()
        
        return jsonify({
            'consultation_id': consultation[0],
            'user_id': consultation[1],
            'agronomist_id': consultation[2],
            'plant_image_url': consultation[3],
            'description': consultation[4],
            'region': consultation[5],
            'season': consultation[6],
            'status': consultation[7],
            'diagnosis': consultation[8],
            'remedies': consultation[9],
            'created_at': consultation[10],
            'diagnosed_at': consultation[11]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consultation_bp.route('/user/list', methods=['GET'])
@jwt_required()
def get_user_consultations():
    """Get all consultations for logged-in user"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        cursor.execute('''
            SELECT id, agronomist_id, plant_image_url, description, region, season, 
                   status, created_at, diagnosed_at
            FROM consultations 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (user_id, limit, offset))
        
        consultations = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'consultations': [
                {
                    'consultation_id': c[0],
                    'agronomist_id': c[1],
                    'plant_image_url': c[2],
                    'description': c[3],
                    'region': c[4],
                    'season': c[5],
                    'status': c[6],
                    'created_at': c[7],
                    'diagnosed_at': c[8]
                }
                for c in consultations
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consultation_bp.route('/agronomist/list', methods=['GET'])
@jwt_required()
def get_agronomist_consultations():
    """Get all consultations for logged-in agronomist"""
    try:
        agronomist_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        cursor.execute('''
            SELECT id, user_id, plant_image_url, description, region, season, 
                   status, created_at, diagnosed_at
            FROM consultations 
            WHERE agronomist_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (agronomist_id, limit, offset))
        
        consultations = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'consultations': [
                {
                    'consultation_id': c[0],
                    'user_id': c[1],
                    'plant_image_url': c[2],
                    'description': c[3],
                    'region': c[4],
                    'season': c[5],
                    'status': c[6],
                    'created_at': c[7],
                    'diagnosed_at': c[8]
                }
                for c in consultations
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
