"""
App Initialization and Core Setup with Security Enhancements
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
# Removed FastAPI usage -- using Flask only
from blog_routes import router as blog_router

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_EXPIRY', 25200))
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_FILE_SIZE', 16 * 1024 * 1024))
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads/')

# CORS: Restrict origins before production
cors_env = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:19000')
CORS(app, origins=cors_env.split(','), supports_credentials=True)

jwt = JWTManager(app)

# Rate Limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Logging
if not os.path.exists('logs'):
    os.makedirs('logs')
file_handler = RotatingFileHandler(
    os.getenv('LOG_FILE', 'logs/app.log'),
    maxBytes=10240000,
    backupCount=10
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
log_level = getattr(logging, os.getenv('LOG_LEVEL', 'INFO'))
app.logger.addHandler(file_handler)
app.logger.setLevel(log_level)
app.logger.info('Plant Health Diagnosis API startup')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

try:
    from db.mysql_connection import test_connection
    if test_connection():
        app.logger.info('✅ MySQL database connected successfully')
    else:
        app.logger.error('❌ MySQL database connection failed')
except Exception as e:
    app.logger.error(f'❌ Database connection error: {str(e)}')

# Import and register blueprints
from auth_routes import auth_bp
from stats_routes import stats_bp

# Register blog routes as Blueprint
app.register_blueprint(blog_router)

limiter.limit("5 per minute")(auth_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(stats_bp)

app.logger.info('✅ Registered blueprints: blog, auth, stats')

@app.route('/api/health', methods=['GET'])
def health_check():
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
    return jsonify({
        'apiVersion': '1.0.0',
        'consultationFee': int(os.getenv('CONSULTATION_FEE', 500)),
        'platformCommission': float(os.getenv('PLATFORM_COMMISSION', 0.30)),
        'agronomistCommission': float(os.getenv('AGRONOMIST_COMMISSION', 0.70)),
        'maxFileSize': app.config['MAX_CONTENT_LENGTH'],
        'allowedExtensions': os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,webp').split(',')
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.logger.info(f'Starting Flask app on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
