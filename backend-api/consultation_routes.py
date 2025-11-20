"""Consultation Routes - FIFO matching and consultation management (with input validation)"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import sqlite3
import uuid
from email_notifications import send_email_notification
from middleware.validation import sanitize_string, validate_consultation

consultation_bp = Blueprint('consultation', __name__, url_prefix='/api/consultation')
DB_PATH = 'database.db'

def get_available_agronomist():
    # ... unchanged ...
    pass

@consultation_bp.route('/submit', methods=['POST'])
@jwt_required()
@validate_consultation
def submit_consultation():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate input (sanitized by middleware now)
        plant_image = sanitize_string(data.get('plant_image'))
        description = sanitize_string(data.get('description'))
        region = sanitize_string(data.get('region'))
        season = sanitize_string(data.get('season'))

        agronomist = get_available_agronomist()
        if not agronomist:
            return jsonify({'error': 'No agronomists available'}), 503

        agronomist_id, agronomist_name, agronomist_email = agronomist

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        consultation_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO consultations (id, user_id, agronomist_id, plant_image_url, description, region, season, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        ''', (
            consultation_id, user_id, agronomist_id,
            plant_image, description, region, season,
            datetime.utcnow()
        ))
        conn.commit()
        cursor.execute('SELECT email, name FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        if user:
            send_email_notification(
                user[0],
                'Consultation Submitted',
                f'Your consultation has been submitted and assigned to {agronomist_name}. Consultation ID: {consultation_id}'
            )
        send_email_notification(
            agronomist_email,
            f'New Consultation Assigned',
            f'You have been assigned a new consultation (ID: {consultation_id}) on {season} in {region}. Plant issue: {description}'
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
    try:
        agronomist_id = get_jwt_identity()
        data = request.get_json()
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
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
        diagnosis = sanitize_string(data.get('diagnosis') or "")
        remedies = sanitize_string(data.get('remedies') or "")
        cursor.execute('''
            UPDATE consultations SET status = 'diagnosed', diagnosis = ?, remedies = ?, diagnosed_at = ? WHERE id = ?
        ''', (
            diagnosis,
            remedies,
            datetime.utcnow(),
            consultation_id
        ))
        conn.commit()
        cursor.execute('SELECT email FROM users WHERE id = ?', (consultation[1],))
        user_email = cursor.fetchone()
        conn.close()
        if user_email:
            send_email_notification(
                user_email[0],
                'Diagnosis Ready',
                f'Your consultation diagnosis is ready! Diagnosis: {diagnosis}. Remedies: {remedies}'
            )
        return jsonify({
            'consultation_id': consultation_id,
            'status': 'diagnosed',
            'diagnosed_at': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# (other routes unchanged)
