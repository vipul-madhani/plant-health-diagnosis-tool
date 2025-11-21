from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query, execute_many
from datetime import datetime

agro_reg_bp = Blueprint('agro_reg', __name__, url_prefix='/api/agronomist')

# --- Submit registration (frontend form POSTs to here) ---
@agro_reg_bp.route('/register', methods=['POST'])
def register_agronomist():
    try:
        data = request.form or request.json
        full_name = data.get('fullName')
        email = data.get('email')
        phone = data.get('phone')
        location_lat = data.get('locationLat')
        location_long = data.get('locationLong')
        bio = data.get('bio')
        specializations = data.get('specializations')
        registration_type = data.get('registrationType')
        qualification = data.get('qualification')
        years_experience = data.get('yearsExperience')
        experience_description = data.get('experienceDescription')

        # File uploads (URLs assumed via S3 or stored filename)
        identity_proof_url = data.get('identityProofFile')
        certification_url = data.get('certificationFile')
        photo_url = data.get('photoFile')

        query = '''
        INSERT INTO agronomist_registrations
        (full_name, email, phone, location_lat, location_long, bio, specializations, registration_type, qualification, years_experience, experience_description, identity_proof_url, certification_url, photo_url, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
        '''
        params = (full_name, email, phone, location_lat, location_long, bio, specializations, registration_type, qualification, years_experience, experience_description, identity_proof_url, certification_url, photo_url, datetime.now())
        reg_id = execute_query(query, params=params, commit=True)
        return jsonify({'success': True, 'message': 'Registration submitted', 'id': reg_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Get pending registrations (for admin) ---
@agro_reg_bp.route('/pending', methods=['GET'])
def admin_get_pending_agronomists():
    try:
        query = "SELECT * FROM agronomist_registrations WHERE status='pending' ORDER BY created_at ASC"
        results = execute_query(query, fetch_all=True)
        return jsonify({'success':True, 'data': results}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Approve agronomist registration (admin) ---
@agro_reg_bp.route('/approve/<int:reg_id>', methods=['POST'])
def admin_approve_agronomist(reg_id):
    try:
        notes = request.json.get('notes', '')
        query = "UPDATE agronomist_registrations SET status='approved', admin_notes=%s, verified_at=%s WHERE id=%s"
        params = (notes, datetime.now(), reg_id)
        execute_query(query, params=params, commit=True)
        return jsonify({'success': True, 'message': 'Agronomist approved and activated', 'id': reg_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Reject agronomist registration (admin) ---
@agro_reg_bp.route('/reject/<int:reg_id>', methods=['POST'])
def admin_reject_agronomist(reg_id):
    try:
        reason = request.json.get('reason', 'Document verification failed')
        query = "UPDATE agronomist_registrations SET status='rejected', admin_notes=%s, rejected_at=%s WHERE id=%s"
        params = (reason, datetime.now(), reg_id)
        execute_query(query, params=params, commit=True)
        return jsonify({'success': True, 'message': 'Agronomist registration rejected', 'id': reg_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Attach to app in backend-api/app.py:
#   from agro_reg_routes import agro_reg_bp
#   app.register_blueprint(agro_reg_bp)
