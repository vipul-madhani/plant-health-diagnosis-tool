from flask import Blueprint, request, jsonify
from db.mysql_connection import execute_query
from werkzeug.security import generate_password_hash, check_password_hash
import jwt, datetime, os

user_auth_bp = Blueprint('user_auth', __name__, url_prefix='/api/user')
JWT_SECRET = os.getenv('SECRET_KEY', 'testjwtsecret')
JWT_EXP_SEC = 60*60*24*3

# --- Registration (user only, extends easily for agronomist/admin) ---
@user_auth_bp.route('/register', methods=['POST'])
def user_register():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone = data.get('phone')
        role = data.get('role', 'user')
        if not (name and email and password):
            return jsonify({'error': 'All fields required'}), 400
        # Hash password
        pw_hash = generate_password_hash(password)
        # Insert user
        result = execute_query(
            "INSERT INTO users (name, email, password_hash, phone, role) VALUES (%s, %s, %s, %s, %s)",
            params=(name, email, pw_hash, phone, role), commit=True)
        return jsonify({'success': True, 'user_id': result}), 201
    except Exception as e:
        if 'Duplicate entry' in str(e):
            return jsonify({'error': 'Email already registered'}), 409
        return jsonify({'error': str(e)}), 500

# --- Login ---
@user_auth_bp.route('/login', methods=['POST'])
def user_login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        if not (email and password):
            return jsonify({'error': 'Missing email/password'}), 400
        user = execute_query(
            "SELECT * FROM users WHERE email=%s AND is_active=1",
            params=(email,), fetch_one=True)
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_SEC)
        }, JWT_SECRET, algorithm='HS256')
        user_payload = {key: user[key] for key in user if key not in ['password_hash']} # clean
        return jsonify({'token': token, 'user': user_payload}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Auth check (whoami) ---
@user_auth_bp.route('/me', methods=['GET'])
def user_me():
    try:
        auth = request.headers.get('Authorization', '')
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'error': 'Missing/invalid Authorization header'}), 401
        token = auth.split(' ')[1]
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = data.get('user_id')
        user = execute_query(
            "SELECT * FROM users WHERE id=%s AND is_active=1",
            params=(user_id,), fetch_one=True)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_payload = {key: user[key] for key in user if key not in ['password_hash']}
        return jsonify({'user': user_payload}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 401

# --- Protect with app.register_blueprint(user_auth_bp) in app.py ---
