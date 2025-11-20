"""
Plant Health Diagnosis Tool - Backend API
Flask-based REST API with MySQL database integration
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration from environment variables
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_EXPIRY', 25200))  # 7 hours default
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_FILE_SIZE', 16 * 1024 * 1024))  # 16MB
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads/')

# CORS Configuration
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:19000').split(',')
CORS(app, origins=cors_origins, supports_credentials=True)

# JWT Manager
jwt = JWTManager(app)

# Setup logging
if not os.path.exists('logs'):
    os.makedirs('logs')

file_handler = RotatingFileHandler(
    os.getenv('LOG_FILE', 'logs/app.log'),
    maxBytes=10240000,  # 10MB
    backupCount=10
)

file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))

log_level = getattr(logging, os.getenv('LOG_LEVEL', 'INFO'))
app.logger.addHandler(file_handler)
app.logger.setLevel(log_level)
app.logger.info('Plant Health Diagnosis API startup')

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Test database connection on startup
try:
    from db.mysql_connection import test_connection
    if test_connection():
        app.logger.info('✅ MySQL database connected successfully')
    else:
        app.logger.error('❌ MySQL database connection failed')
except Exception as e:
    app.logger.error(f'❌ Database connection error: {str(e)}')

# Import and register blueprints
try:
    # Note: These route files need to be converted to Flask blueprints
    # For now, we'll create placeholder imports
    # from auth_routes import auth_bp
    # from consultation_routes import consultation_bp
    # from chat_routes import chat_bp
    # from blog_routes import blog_bp
    # from admin_routes import admin_bp
    # from community_routes import community_bp
    
    # app.register_blueprint(auth_bp, url_prefix='/api/auth')
    # app.register_blueprint(consultation_bp, url_prefix='/api/consultation')
    # app.register_blueprint(chat_bp, url_prefix='/api/chat')
    # app.register_blueprint(blog_bp, url_prefix='/api/blog')
    # app.register_blueprint(admin_bp, url_prefix='/api/admin')
    # app.register_blueprint(community_bp, url_prefix='/api/community')
    
    app.logger.info('Routes loaded successfully')
except ImportError as e:
    app.logger.warning(f'Some route modules not found: {str(e)}')
    app.logger.info('Running with basic routes only')


# ==========================================
# BASIC ROUTES (Until blueprints are ready)
# ==========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    from db.mysql_connection import test_connection
    
    db_status = 'connected' if test_connection() else 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'message': 'Plant Health Diagnosis API is running',
        'database': db_status,
        'version': '1.0.0'
    }), 200


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get public configuration"""
    return jsonify({
        'apiVersion': '1.0.0',
        'consultationFee': int(os.getenv('CONSULTATION_FEE', 500)),
        'platformCommission': float(os.getenv('PLATFORM_COMMISSION', 0.30)),
        'agronomistCommission': float(os.getenv('AGRONOMIST_COMMISSION', 0.70)),
        'maxFileSize': app.config['MAX_CONTENT_LENGTH'],
        'allowedExtensions': os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,webp').split(',')
    }), 200


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'Internal server error: {str(error)}')
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'error': 'File size exceeds maximum allowed size'}), 413


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token has expired',
        'message': 'Please login again'
    }), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Invalid token',
        'message': 'Authentication required'
    }), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Authorization required',
        'message': 'Request does not contain a valid token'
    }), 401


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    app.logger.info(f'Starting Flask app on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
