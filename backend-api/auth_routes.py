#!/usr/bin/env python3
"""
Authentication Routes - Plant Health Diagnosis Tool
Handles user registration, login, token refresh, and logout
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import hashlib
import os
from email_notifications import send_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
TOKEN_EXPIRY = 3600  # 1 hour
REFRESH_TOKEN_EXPIRY = 86400 * 7  # 7 days

# TODO: Import database connection from main app
db = None

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

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
        
        # Validation
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
        
        # Hash password
        password_hash = hash_password(password)
        
        # TODO: Insert into database
        # cursor.execute('''
        #     INSERT INTO users (email, password_hash, first_name, last_name, phone, 
        #                        latitude, longitude, is_expert, created_at)
        #     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        # ''', (email, password_hash, first_name, last_name, phone, latitude, longitude, False, datetime.now()))
        # db.commit()
        # user_id = cursor.lastrowid
        
        user_id = 1  # Mock for now
        
        # Send registration confirmation email
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
        # Check if FormData
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
        
        # Validate document upload
        if 'document' not in request.files:
            return jsonify({'error': 'Document file required'}), 400
        
        document = request.files['document']
        
        # TODO: Save document to storage (S3 or Firebase)
        # document_url = upload_to_storage(document)
        
        password_hash = hash_password(password)
        
        # TODO: Insert into database with verification_status='pending'
        # cursor.execute('''
        #     INSERT INTO users (email, password_hash, first_name, last_name, phone,
        #                        latitude, longitude, is_expert, document_type, document_url,
        #                        verification_status, created_at)
        #     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        # ''', (email, password_hash, first_name, last_name, phone, latitude, longitude,
        #       True, document_type, document_url, 'pending', datetime.now()))
        # db.commit()
        # agronomist_id = cursor.lastrowid
        
        agronomist_id = 1  # Mock
        
        # Send verification email to admin
        send_email(
            to='admin@planthealth.com',
            subject=f'New Agronomist Registration: {first_name} {last_name}',
            body=f"New agronomist registration requiring verification:\nEmail: {email}\nPhone: {phone}\n\nPlease review and approve/reject in the admin dashboard."
        )
        
        # Send confirmation to agronomist
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
        user_type = data.get('user_type', 'user')  # 'user' or 'agronomist'
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        password_hash = hash_password(password)
        
        # TODO: Query user from database
        # cursor.execute('''
        #     SELECT id, email, first_name, is_expert, password_hash, verification_status
        #     FROM users WHERE email = %s
        # ''', (email,))
        # user = cursor.fetchone()
        
        # Mock user for now
        user = {'id': 1, 'email': email, 'first_name': 'John', 'is_expert': user_type == 'agronomist', 'password_hash': password_hash, 'verification_status': 'verified'}
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        if user['password_hash'] != password_hash:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if agronomist is verified
        if user['is_expert'] and user['verification_status'] != 'verified':
            return jsonify({'error': 'Your account is not yet verified. Please wait for admin approval.'}), 403
        
        # Generate tokens
        user_role = 'agronomist' if user['is_expert'] else 'user'
        access_token, refresh_token = generate_tokens(user['id'], user_role)
        
        # TODO: Store refresh token in database
        # cursor.execute('''
        #     INSERT INTO user_sessions (user_id, refresh_token, expires_at, created_at)
        #     VALUES (%s, %s, %s, %s)
        # ''', (user['id'], refresh_token, datetime.utcnow() + timedelta(seconds=REFRESH_TOKEN_EXPIRY), datetime.utcnow()))
        # db.commit()
        
        # Send login notification email
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

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """
    POST /api/auth/refresh
    Refresh access token using refresh token
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing refresh token'}), 401
        
        refresh_token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            # TODO: Verify refresh token in database
            # cursor.execute('''
            #     SELECT user_id FROM user_sessions WHERE refresh_token = %s AND expires_at > %s
            # ''', (refresh_token, datetime.utcnow()))
            # session = cursor.fetchone()
            # if not session:
            #     return jsonify({'error': 'Invalid or expired refresh token'}), 401
            
            # Get user role
            # cursor.execute('SELECT is_expert FROM users WHERE id = %s', (user_id,))
            # user = cursor.fetchone()
            # user_role = 'agronomist' if user['is_expert'] else 'user'
            
            user_role = 'user'  # Mock
            
            # Generate new tokens
            access_token, new_refresh_token = generate_tokens(user_id, user_role)
            
            # TODO: Update refresh token in database
            
            return jsonify({
                'success': True,
                'access_token': access_token,
                'refresh_token': new_refresh_token
            }), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Refresh token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid refresh token'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    POST /api/auth/logout
    Logout user and invalidate tokens
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing token'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            # TODO: Invalidate all user sessions in database
            # cursor.execute('DELETE FROM user_sessions WHERE user_id = %s', (user_id,))
            # db.commit()
            
            return jsonify({
                'success': True,
                'message': 'Logged out successfully'
            }), 200
            
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('Auth routes blueprint loaded')
