import jwt, os
from functools import wraps
from flask import request, jsonify

JWT_SECRET = os.getenv('SECRET_KEY', 'testjwtsecret')

def jwt_required_role(roles=None):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            auth = request.headers.get('Authorization', '')
            if not auth or not auth.startswith('Bearer '):
                return jsonify({'error': 'Missing/invalid Authorization header'}), 401
            try:
                token = auth.split(' ')[1]
                data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                if roles and data.get('role') not in roles:
                    return jsonify({'error': 'Insufficient role'}), 403
                request.user = data
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired'}), 401
            except Exception as e:
                return jsonify({'error': str(e)}), 401
            return f(*args, **kwargs)
        return wrapped
    return decorator
