"""
Input Validation Middleware
Validates and sanitizes user input to prevent SQL injection and XSS attacks
"""

from functools import wraps
from flask import request, jsonify
import re
from email_validator import validate_email as email_validate, EmailNotValidError


def validate_email(email):
    """Validate email format"""
    try:
        email_validate(email)
        return True
    except EmailNotValidError:
        return False


def validate_phone(phone):
    """Validate Indian phone number format"""
    # Indian phone: +91XXXXXXXXXX or 10 digits
    pattern = r'^(\+91)?[6-9]\d{9}$'
    return re.match(pattern, str(phone)) is not None


def validate_password(password):
    """
    Validate password strength
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Valid password"


def sanitize_string(text):
    """Remove potentially harmful characters from strings"""
    if not isinstance(text, str):
        return text
    
    # Remove SQL injection patterns
    dangerous_patterns = [
        r'(--|;|\*|\bOR\b|\bAND\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)',
        r'(<script|</script|javascript:|onerror=|onclick=)'
    ]
    
    cleaned = text
    for pattern in dangerous_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    return cleaned.strip()


def validate_registration(f):
    """Validate user registration data"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate email
        if 'email' not in data or not data['email']:
            return jsonify({'error': 'Email is required'}), 400
        
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password
        if 'password' not in data or not data['password']:
            return jsonify({'error': 'Password is required'}), 400
        
        valid, message = validate_password(data['password'])
        if not valid:
            return jsonify({'error': message}), 400
        
        # Validate name
        if 'name' not in data or len(data['name'].strip()) < 2:
            return jsonify({'error': 'Name must be at least 2 characters'}), 400
        
        # Validate role
        if 'role' not in data or data['role'] not in ['farmer', 'agronomist', 'admin']:
            return jsonify({'error': 'Invalid role. Must be farmer, agronomist, or admin'}), 400
        
        # Sanitize strings
        data['name'] = sanitize_string(data['name'])
        data['email'] = data['email'].lower().strip()
        
        # Validate phone if provided
        if 'phone' in data and data['phone']:
            if not validate_phone(data['phone']):
                return jsonify({'error': 'Invalid phone number format'}), 400
        
        return f(*args, **kwargs)
    return decorated_function


def validate_login(f):
    """Validate login credentials"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'email' not in data or not validate_email(data['email']):
            return jsonify({'error': 'Valid email is required'}), 400
        
        if 'password' not in data or len(data['password']) < 8:
            return jsonify({'error': 'Password is required'}), 400
        
        data['email'] = data['email'].lower().strip()
        
        return f(*args, **kwargs)
    return decorated_function


def validate_consultation(f):
    """Validate consultation submission data"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for file upload
        if 'image' not in request.files:
            return jsonify({'error': 'Plant image is required'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
        if '.' not in file.filename:
            return jsonify({'error': 'Invalid file type'}), 400
        
        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({'error': f'File type .{ext} not allowed. Use: png, jpg, jpeg, webp'}), 400
        
        # Validate form data
        description = request.form.get('description', '')
        if description:
            sanitized_desc = sanitize_string(description)
            request.form = request.form.copy()
            request.form['description'] = sanitized_desc
        
        return f(*args, **kwargs)
    return decorated_function


def validate_chat_message(f):
    """Validate chat message data"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'message' not in data or not data['message'].strip():
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        if len(data['message']) > 5000:
            return jsonify({'error': 'Message too long (max 5000 characters)'}), 400
        
        # Sanitize message
        data['message'] = sanitize_string(data['message'])
        
        return f(*args, **kwargs)
    return decorated_function


def validate_id(f):
    """Validate ID parameters"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for ID in URL parameters
        for key in kwargs:
            if key.endswith('_id') or key == 'id':
                try:
                    # Ensure ID is a positive integer
                    id_value = int(kwargs[key])
                    if id_value <= 0:
                        return jsonify({'error': f'Invalid {key}'}), 400
                    kwargs[key] = id_value
                except ValueError:
                    return jsonify({'error': f'Invalid {key} format'}), 400
        
        return f(*args, **kwargs)
    return decorated_function


def validate_pagination(f):
    """Validate pagination parameters"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        
        if page < 1:
            return jsonify({'error': 'Page must be greater than 0'}), 400
        
        if limit < 1 or limit > 100:
            return jsonify({'error': 'Limit must be between 1 and 100'}), 400
        
        return f(*args, **kwargs)
    return decorated_function
