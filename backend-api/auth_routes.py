#!/usr/bin/env python3
"""
Authentication Routes - Plant Health Diagnosis Tool
Handles user registration, login, token refresh, and logout
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import os
from email_notifications import send_email
import bcrypt

# Abort startup if SECRET_KEY is not properly set
SECRET_KEY = os.environ.get('SECRET_KEY', None)
if not SECRET_KEY or SECRET_KEY == 'dev-key-change-in-production':
    raise ValueError('SECRET_KEY must be set and cannot be default value')
TOKEN_EXPIRY = 3600  # 1 hour
REFRESH_TOKEN_EXPIRY = 86400 * 7  # 7 days

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# TODO: Import database connection from main app
db = None

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    """Verify password using bcrypt"""
    if isinstance(hashed, str):
        hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def generate_tokens(user_id, user_type):
    """Generate JWT access and refresh tokens"""
    access_payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(seconds=TOKEN_EXPIRY),
        'iat': datetime.utcnow()
    }
    
    refresh_payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(seconds=REFRESH_TOKEN_EXPIRY),
        'iat': datetime.utcnow()
    }
    
    access_token = jwt.encode(access_payload, SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, SECRET_KEY, algorithm='HS256')
    
    return access_token, refresh_token

@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    POST /api/auth/register
    Register a new farmer user
    """
    try:
        data = request.get_json()
        
        required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        phone = data.get('phone')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        # TODO: Check if user already exists
        # cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        # if cursor.fetchone():
        #     return jsonify({'error': 'Email already registered'}), 400
        
        # Secure password
        password_hash = hash_password(password)
        
        # TODO: Insert into database: store password_hash as bytes or base64 encode
        # cursor.execute('''
        #     INSERT INTO users (email, password_hash, first_name, last_name, phone, 
        #                        latitude, longitude, is_expert, created_at)
        #     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        # ''', (email, password_hash, first_name, last_name, phone, latitude, longitude, False, datetime.now()))
        # db.commit()
        # user_id = cursor.lastrowid
        user_id = 1  # Mock for now
        
        send_email(
            to=email,
            subject='Welcome to Plant Health Diagnosis Tool',
            body=f"Hi {first_name},\n\nYour registration is successful! You can now login and start diagnosing plants.\n\nBest regards,\nPlant Health Team"
        )
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Please check your email.',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/agronomist/register', methods=['POST'])
def register_agronomist():
    """
    POST /api/auth/agronomist/register
    Register a new agronomist (requires document verification)
    """
    try:
        if 'email' not in request.form:
            return jsonify({'error': 'Missing required fields'}), 400
        
        email = request.form.get('email')
        password = request.form.get('password')
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        phone = request.form.get('phone')
        document_type = request.form.get('document_type')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        
        if 'document' not in request.files:
            return jsonify({'error': 'Document file required'}), 400
        document = request.files['document']
        
        # Secure password
        password_hash = hash_password(password)
        
        # TODO: Insert into database: store password_hash as bytes or base64 encode
        # cursor.execute('''
        #     INSERT INTO users (email, password_hash, first_name, last_name, phone,
        #                        latitude, longitude, is_expert, document_type, document_url,
        #                        verification_status, created_at)
        #     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        # ''', (email, password_hash, first_name, last_name, phone, latitude, longitude,
        #       True, document_type, document_url, 'pending', datetime.now()))
        # db.commit()
        # agronomist_id = cursor.lastrowid
        agronomist_id = 1  # Mock for now
        
        send_email(
            to='admin@planthealth.com',
            subject=f'New Agronomist Registration: {first_name} {last_name}',
            body=f"New agronomist registration requiring verification:\nEmail: {email}\nPhone: {phone}\n\nPlease review and approve/reject in the admin dashboard."
        )
        send_email(
            to=email,
            subject='Agronomist Registration Under Review',
            body=f"Hi {first_name},\n\nYour registration has been submitted. Our team will verify your documents and contact you within 24 hours.\n\nBest regards,\nPlant Health Team"
        )
        return jsonify({
            'success': True,
            'message': 'Registration submitted. Your documents are under review.',
            'agronomist_id': agronomist_id,
            'status': 'pending'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Login user (farmer or agronomist)
    """
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        user_type = data.get('user_type', 'user')
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        # TODO: Query user from database
        # cursor.execute('''
        #     SELECT id, email, first_name, is_expert, password_hash, verification_status
        #     FROM users WHERE email = %s
        # ''', (email,))
        # user = cursor.fetchone()
        user = {'id': 1, 'email': email, 'first_name': 'John', 'is_expert': user_type == 'agronomist', 'password_hash': hash_password(password), 'verification_status': 'verified'}
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        # Replace with bcrypt verification
        if not verify_password(password, user['password_hash']):
            return jsonify({'error': 'Invalid email or password'}), 401
        if user['is_expert'] and user['verification_status'] != 'verified':
            return jsonify({'error': 'Your account is not yet verified. Please wait for admin approval.'}), 403
        user_role = 'agronomist' if user['is_expert'] else 'user'
        access_token, refresh_token = generate_tokens(user['id'], user_role)
        send_email(
            to=email,
            subject='Login Notification - Plant Health Diagnosis Tool',
            body=f"Hi {user['first_name']},\n\nYou just logged in to Plant Health Diagnosis Tool.\n\nIf this wasn't you, please change your password immediately.\n\nBest regards,\nPlant Health Team"
        )
        return jsonify({
            'success': True,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'first_name': user['first_name'],
                'role': user_role
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# (Rest of code unchanged, see previous version)
