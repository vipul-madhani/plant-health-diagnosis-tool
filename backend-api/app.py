"""
Plant Health Diagnosis Tool - Backend API
Flask-based REST API for plant disease diagnosis
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads/'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def allowed_file(filename):
    """Check if uploaded file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Plant Health Diagnosis API is running'
    }), 200


@app.route('/api/diagnose', methods=['POST'])
def diagnose_plant():
    """
    Main endpoint for plant diagnosis
    Accepts image upload and returns diagnosis
    """
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # TODO: Load ML model and perform prediction
            # For now, return mock response
            diagnosis_result = {
                'plant_species': 'Tomato',
                'health_status': 'Diseased',
                'primary_issue': {
                    'name': 'Late Blight',
                    'confidence': 0.89,
                    'severity': 'High'
                },
                'secondary_issues': [],
                'treatment_recommendations': [
                    'Remove affected leaves immediately',
                    'Apply copper-based fungicide',
                    'Improve air circulation around plants',
                    'Avoid overhead watering'
                ],
                'local_suppliers': [],
                'image_quality_score': 0.92
            }
            
            logger.info(f\"Diagnosis completed for {filename}\")
            
            # Clean up uploaded file
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'diagnosis': diagnosis_result
            }), 200
        
        return jsonify({'error': 'Invalid file type. Allowed: png, jpg, jpeg'}), 400
    
    except Exception as e:
        logger.error(f\"Error in diagnosis: {str(e)}\")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/species', methods=['GET'])
def get_supported_species():
    """Get list of supported plant species"""
    # TODO: Load from database
    species = [
        {'id': 1, 'name': 'Tomato', 'scientific_name': 'Solanum lycopersicum'},
        {'id': 2, 'name': 'Potato', 'scientific_name': 'Solanum tuberosum'},
        {'id': 3, 'name': 'Apple', 'scientific_name': 'Malus domestica'},
    ]
    return jsonify({'species': species}), 200


@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Submit diagnosis feedback for model improvement"""
    data = request.get_json()
    
    if not data or 'diagnosis_id' not in data:
        return jsonify({'error': 'Invalid feedback data'}), 400
    
    # TODO: Store feedback in database
    logger.info(f\"Feedback received for diagnosis {data['diagnosis_id']}\")
    
    return jsonify({'success': True, 'message': 'Feedback received'}), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
