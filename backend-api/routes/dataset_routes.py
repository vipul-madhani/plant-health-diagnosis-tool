"""
Dataset Management API Routes
Admin endpoints for uploading, managing, and versioning ML training datasets
"""

from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import tempfile
import shutil
from pathlib import Path
from typing import List

from backend-api.services.dataset_manager import DatasetManager
from backend-api.jwt_decorators import token_required

dataset_bp = Blueprint('dataset', __name__, url_prefix='/api/admin/dataset')
dataset_manager = DatasetManager()

# Allowed file extensions
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@dataset_bp.route('/upload', methods=['POST'])
@token_required
def upload_images(current_user):
    """
    Upload images to staging area for dataset enrichment
    
    Expects:
    - files: List of image files
    - class_name: Disease/crop class name
    - metadata: Optional JSON metadata (region, season, severity, etc.)
    
    Returns:
    - Summary of added/rejected images with quality metrics
    """
    # Admin-only endpoint
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    # Validate request
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    class_name = request.form.get('class_name')
    if not class_name:
        return jsonify({"error": "class_name is required"}), 400
    
    # Get optional metadata
    metadata = {}
    if 'region' in request.form:
        metadata['region'] = request.form.get('region')
    if 'season' in request.form:
        metadata['season'] = request.form.get('season')
    if 'severity' in request.form:
        metadata['severity'] = request.form.get('severity')
    if 'crop_type' in request.form:
        metadata['crop_type'] = request.form.get('crop_type')
    if 'notes' in request.form:
        metadata['notes'] = request.form.get('notes')
    
    files = request.files.getlist('files')
    
    # Create temp directory for uploads
    temp_dir = tempfile.mkdtemp()
    temp_files = []
    
    try:
        # Save uploaded files to temp directory
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(temp_dir, filename)
                file.save(filepath)
                temp_files.append(filepath)
        
        if not temp_files:
            return jsonify({"error": "No valid image files provided"}), 400
        
        # Add images to staging with validation
        results = dataset_manager.add_images_to_staging(
            image_files=temp_files,
            class_name=class_name,
            metadata=metadata
        )
        
        return jsonify({
            "success": True,
            "message": f"Processed {results['total_attempted']} images",
            "added": len(results['added']),
            "rejected": len(results['rejected']),
            "duplicates": len(results['duplicates']),
            "details": results
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to process images: {str(e)}"}), 500
    
    finally:
        # Cleanup temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)

@dataset_bp.route('/staging/summary', methods=['GET'])
@token_required
def get_staging_summary(current_user):
    """
    Get summary of images in staging area
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        summary = dataset_manager.get_staging_summary()
        return jsonify({
            "success": True,
            "staging": summary
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dataset_bp.route('/staging/commit', methods=['POST'])
@token_required
def commit_staging(current_user):
    """
    Commit staging area to main dataset and create new version
    
    Optional:
    - version_name: Custom version name (auto-generated if not provided)
    
    Returns:
    - Version info with image counts and paths
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        data = request.get_json() or {}
        version_name = data.get('version_name')
        
        version_info = dataset_manager.commit_staging_to_dataset(version_name)
        
        return jsonify({
            "success": True,
            "message": f"Created dataset version: {version_info['name']}",
            "version": version_info
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dataset_bp.route('/statistics', methods=['GET'])
@token_required
def get_statistics(current_user):
    """
    Get comprehensive dataset statistics
    
    Returns:
    - Total images, classes, versions
    - Per-class distribution
    - Recent additions
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        stats = dataset_manager.get_dataset_statistics()
        return jsonify({
            "success": True,
            "statistics": stats
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dataset_bp.route('/export/manifest', methods=['POST'])
@token_required
def export_manifest(current_user):
    """
    Export training manifest for ML model training
    
    Optional:
    - version: Specific version to export (exports latest if not provided)
    
    Returns:
    - Manifest file with image paths and class mappings
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        data = request.get_json() or {}
        version = data.get('version')
        
        # Create temp manifest file
        temp_manifest = tempfile.mktemp(suffix='.json')
        
        manifest_path = dataset_manager.export_training_manifest(
            output_path=temp_manifest,
            version=version
        )
        
        return send_file(
            manifest_path,
            mimetype='application/json',
            as_attachment=True,
            download_name='training_manifest.json'
        )
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dataset_bp.route('/versions', methods=['GET'])
@token_required
def list_versions(current_user):
    """
    List all dataset versions
    
    Returns:
    - List of versions with creation dates and image counts
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        versions = dataset_manager.metadata.get('versions', [])
        return jsonify({
            "success": True,
            "versions": versions,
            "total_versions": len(versions)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dataset_bp.route('/validate-batch', methods=['POST'])
@token_required
def validate_batch(current_user):
    """
    Validate a batch of images without adding to dataset
    Useful for pre-upload validation
    
    Expects:
    - files: List of image files
    
    Returns:
    - Validation results with quality metrics for each image
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('files')
    temp_dir = tempfile.mkdtemp()
    
    try:
        validation_results = []
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(temp_dir, filename)
                file.save(filepath)
                
                # Validate image
                is_valid, error_msg, quality_metrics = dataset_manager.validate_image(filepath)
                
                validation_results.append({
                    "filename": filename,
                    "is_valid": is_valid,
                    "error": error_msg,
                    "quality_metrics": quality_metrics
                })
        
        valid_count = sum(1 for r in validation_results if r['is_valid'])
        
        return jsonify({
            "success": True,
            "total_files": len(validation_results),
            "valid_files": valid_count,
            "invalid_files": len(validation_results) - valid_count,
            "results": validation_results
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@dataset_bp.route('/classes', methods=['GET'])
@token_required
def list_classes(current_user):
    """
    List all disease/crop classes in dataset
    
    Returns:
    - List of classes with image counts
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        classes = dataset_manager.metadata.get('classes', {})
        
        class_list = []
        for class_name, class_info in classes.items():
            class_list.append({
                "name": class_name,
                "total_images": class_info['total_images'],
                "versions": class_info['versions']
            })
        
        # Sort by image count (descending)
        class_list.sort(key=lambda x: x['total_images'], reverse=True)
        
        return jsonify({
            "success": True,
            "classes": class_list,
            "total_classes": len(class_list)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Register blueprint in main app
def register_dataset_routes(app):
    """Register dataset routes with Flask app"""
    app.register_blueprint(dataset_bp)
