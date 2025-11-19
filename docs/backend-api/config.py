import os
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', False)
    TESTING = False
    
    # API
    API_PORT = int(os.getenv('API_PORT', 5000))
    API_HOST = os.getenv('API_HOST', '127.0.0.1')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:8000').split(',')
    
    # JWT Token Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')
    FIREBASE_PRIVATE_KEY = os.getenv('FIREBASE_PRIVATE_KEY')
    FIREBASE_CLIENT_EMAIL = os.getenv('FIREBASE_CLIENT_EMAIL')
    FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL')
    FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET')
    
    # API Rate Limiting
    RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', True)
    RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'memory://')
    REQUESTS_PER_HOUR = int(os.getenv('REQUESTS_PER_HOUR', 100))
    
    # ML Model Configuration
    MODEL_PATH = os.getenv('MODEL_PATH', 'models/plant_disease_model.h5')
    MODEL_CONFIDENCE_THRESHOLD = float(os.getenv('MODEL_CONFIDENCE_THRESHOLD', 0.7))
    IMAGE_MAX_SIZE = int(os.getenv('IMAGE_MAX_SIZE', 5242880))  # 5MB in bytes
    IMAGE_INPUT_SIZE = int(os.getenv('IMAGE_INPUT_SIZE', 224))  # 224x224 for ResNet
    
    # Image Processing
    ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    IMAGE_QUALITY_MIN_SCORE = float(os.getenv('IMAGE_QUALITY_MIN_SCORE', 0.5))
    
    # Database
    FIRESTORE_COLLECTION_USERS = 'users'
    FIRESTORE_COLLECTION_DIAGNOSES = 'diagnoses'
    FIRESTORE_COLLECTION_TREATMENTS = 'treatments'
    FIRESTORE_COLLECTION_FEEDBACK = 'treatment_feedback'
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/app.log')
    
    # Celery Configuration (for async tasks)
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    
    # Feature Flags
    FEATURE_EXPERT_VALIDATION = os.getenv('FEATURE_EXPERT_VALIDATION', True)
    FEATURE_COMMUNITY_FEEDBACK = os.getenv('FEATURE_COMMUNITY_FEEDBACK', True)
    FEATURE_GEO_AWARE_RECOMMENDATIONS = os.getenv('FEATURE_GEO_AWARE_RECOMMENDATIONS', True)
    FEATURE_AR_GUIDES = os.getenv('FEATURE_AR_GUIDES', True)
    

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    # In production, ensure all sensitive configs are set via environment
    

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    MODEL_CONFIDENCE_THRESHOLD = 0.5  # Lower for testing
    

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    
    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }
    
    return config_map.get(env, DevelopmentConfig)
