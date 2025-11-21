"""
ML Admin Dashboard API Routes
Endpoints for monitoring ML model performance, managing training jobs, and dataset analytics
"""

from flask import Blueprint, request, jsonify
from backend-api.jwt_decorators import token_required
from backend-api.services.model_performance_tracker import ModelPerformanceTracker
from backend-api.services.ml_retraining_orchestrator import get_retraining_orchestrator, TrainingStatus
from backend-api.services.dataset_manager import DatasetManager

ml_admin_bp = Blueprint('ml_admin', __name__, url_prefix='/api/admin/ml')

# Initialize services
performance_tracker = ModelPerformanceTracker()
orchestrator = get_retraining_orchestrator()
dataset_manager = DatasetManager()

@ml_admin_bp.route('/performance/overall', methods=['GET'])
@token_required
def get_overall_performance(current_user):
    """
    Get overall model performance metrics
    
    Returns:
    - Total predictions
    - Accuracy
    - Average confidence
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        metrics = performance_tracker.get_overall_metrics()
        return jsonify({
            "success": True,
            "metrics": metrics
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/performance/by-class', methods=['GET'])
@token_required
def get_class_performance(current_user):
    """
    Get per-class model performance
    
    Optional query params:
    - class_name: Specific class to get metrics for
    
    Returns:
    - Per-class accuracy, confidence, false positives/negatives
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        class_name = request.args.get('class_name')
        metrics = performance_tracker.get_class_metrics(class_name)
        
        return jsonify({
            "success": True,
            "class_metrics": metrics
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/performance/by-model', methods=['GET'])
@token_required
def get_model_performance(current_user):
    """
    Get per-model performance metrics
    
    Optional query params:
    - model_id: Specific model to get metrics for
    
    Returns:
    - Accuracy, confidence, inference time stats per model
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        model_id = request.args.get('model_id')
        metrics = performance_tracker.get_model_metrics(model_id)
        
        return jsonify({
            "success": True,
            "model_metrics": metrics
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/performance/trends', methods=['GET'])
@token_required
def get_performance_trends(current_user):
    """
    Get daily performance trends
    
    Optional query params:
    - days: Number of days to fetch (default 30)
    
    Returns:
    - Daily accuracy and prediction counts
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        days = int(request.args.get('days', 30))
        trends = performance_tracker.get_daily_trends(days)
        
        return jsonify({
            "success": True,
            "trends": trends,
            "days": days
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/performance/confusion-matrix', methods=['POST'])
@token_required
def get_confusion_matrix(current_user):
    """
    Generate confusion matrix
    
    Expects:
    - classes: List of class names
    
    Returns:
    - Confusion matrix with prediction vs ground truth
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        data = request.get_json()
        classes = data.get('classes', [])
        
        if not classes:
            return jsonify({"error": "classes list required"}), 400
        
        matrix = performance_tracker.get_confusion_matrix(classes)
        
        return jsonify({
            "success": True,
            "confusion_matrix": matrix,
            "classes": classes
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/performance/low-confidence', methods=['GET'])
@token_required
def get_low_confidence_predictions(current_user):
    """
    Get predictions with low confidence for expert review
    
    Optional query params:
    - threshold: Confidence threshold (default 0.7)
    - limit: Max results (default 100)
    
    Returns:
    - List of low-confidence predictions needing review
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        threshold = float(request.args.get('threshold', 0.7))
        limit = int(request.args.get('limit', 100))
        
        predictions = performance_tracker.get_low_confidence_predictions(threshold, limit)
        
        return jsonify({
            "success": True,
            "predictions": predictions,
            "count": len(predictions),
            "threshold": threshold
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/performance/drift-detection', methods=['GET'])
@token_required
def detect_drift(current_user):
    """
    Detect model performance drift
    
    Optional query params:
    - window_size: Number of recent predictions to analyze (default 100)
    
    Returns:
    - Drift detection results and recommendations
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        window_size = int(request.args.get('window_size', 100))
        drift_info = performance_tracker.detect_performance_drift(window_size)
        
        return jsonify({
            "success": True,
            "drift_analysis": drift_info
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/models/active', methods=['GET'])
@token_required
def get_active_model(current_user):
    """
    Get currently active model info
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        active_model = performance_tracker.get_active_model()
        return jsonify({
            "success": True,
            "active_model": active_model
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/models/list', methods=['GET'])
@token_required
def list_models(current_user):
    """
    List all registered models
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        models = performance_tracker.list_models()
        return jsonify({
            "success": True,
            "models": models,
            "total": len(models)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/experiments', methods=['GET'])
@token_required
def list_experiments(current_user):
    """
    List training experiments
    
    Optional query params:
    - status: Filter by status (pending, running, completed, failed)
    - limit: Max results (default 50)
    
    Returns:
    - List of training experiments with status and metrics
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        status_str = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        
        status = None
        if status_str:
            status = TrainingStatus[status_str.upper()]
        
        experiments = orchestrator.list_experiments(status, limit)
        
        return jsonify({
            "success": True,
            "experiments": experiments,
            "count": len(experiments)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/schedule', methods=['POST'])
@token_required
def schedule_training(current_user):
    """
    Schedule a new training job
    
    Expects:
    - config_name: Training config name
    - priority: Job priority (default 5)
    - gpu_required: Whether GPU is required (default False)
    - max_epochs: Maximum epochs (default 50)
    - early_stopping_patience: Early stopping patience (default 5)
    
    Returns:
    - Experiment ID
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        data = request.get_json()
        config_name = data.get('config_name')
        
        if not config_name:
            return jsonify({"error": "config_name required"}), 400
        
        experiment_id = orchestrator.schedule_training(
            config_name=config_name,
            priority=data.get('priority', 5),
            gpu_required=data.get('gpu_required', False),
            max_epochs=data.get('max_epochs', 50),
            early_stopping_patience=data.get('early_stopping_patience', 5),
            metadata=data.get('metadata')
        )
        
        return jsonify({
            "success": True,
            "experiment_id": experiment_id,
            "message": "Training job scheduled"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/start/<experiment_id>', methods=['POST'])
@token_required
def start_training(current_user, experiment_id):
    """
    Start a pending training job
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        success = orchestrator.start_training(experiment_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Training started for {experiment_id}"
            }), 200
        else:
            return jsonify({"error": "Failed to start training"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/status/<experiment_id>', methods=['GET'])
@token_required
def get_experiment_status(current_user, experiment_id):
    """
    Get training experiment status and metrics
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        experiment = orchestrator.get_experiment_status(experiment_id)
        
        if experiment:
            return jsonify({
                "success": True,
                "experiment": experiment
            }), 200
        else:
            return jsonify({"error": "Experiment not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/cancel/<experiment_id>', methods=['POST'])
@token_required
def cancel_training(current_user, experiment_id):
    """
    Cancel a training job
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        success = orchestrator.cancel_training(experiment_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": f"Training cancelled for {experiment_id}"
            }), 200
        else:
            return jsonify({"error": "Failed to cancel training"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/compare', methods=['POST'])
@token_required
def compare_experiments(current_user):
    """
    Compare multiple experiments
    
    Expects:
    - experiment_ids: List of experiment IDs
    - metric: Metric to compare (default "val_accuracy")
    
    Returns:
    - Comparison results sorted by metric
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        data = request.get_json()
        experiment_ids = data.get('experiment_ids', [])
        metric = data.get('metric', 'val_accuracy')
        
        if not experiment_ids:
            return jsonify({"error": "experiment_ids required"}), 400
        
        comparison = orchestrator.compare_experiments(experiment_ids, metric)
        
        return jsonify({
            "success": True,
            "comparison": comparison
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/best-model', methods=['GET'])
@token_required
def get_best_model(current_user):
    """
    Get best performing model
    
    Optional query params:
    - metric: Metric to use (default "val_accuracy")
    
    Returns:
    - Best model info and metrics
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        metric = request.args.get('metric', 'val_accuracy')
        best = orchestrator.get_best_model(metric)
        
        return jsonify({
            "success": True,
            "best_model": best,
            "metric": metric
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/auto-retrain-check', methods=['GET'])
@token_required
def check_auto_retrain(current_user):
    """
    Check if model should be retrained
    
    Optional query params:
    - accuracy_threshold: Minimum acceptable accuracy (default 0.90)
    - min_new_samples: Minimum new samples required (default 1000)
    
    Returns:
    - Recommendation on whether to retrain
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        threshold = float(request.args.get('accuracy_threshold', 0.90))
        min_samples = int(request.args.get('min_new_samples', 1000))
        
        recommendation = orchestrator.auto_retrain_check(threshold, min_samples)
        
        return jsonify({
            "success": True,
            "recommendation": recommendation
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@ml_admin_bp.route('/training/quick-experiment', methods=['POST'])
@token_required
def create_quick_experiment(current_user):
    """
    Create and schedule a standard training experiment
    
    Expects:
    - dataset_version: Dataset version to use
    - architecture: Model architecture (default "efficientnet_b0")
    - learning_rate: Learning rate (default 0.001)
    - max_epochs: Max epochs (default 50)
    
    Returns:
    - Experiment ID
    """
    if current_user.get('role') != 'admin':
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        data = request.get_json()
        dataset_version = data.get('dataset_version')
        
        if not dataset_version:
            return jsonify({"error": "dataset_version required"}), 400
        
        experiment_id = orchestrator.create_quick_experiment(
            dataset_version=dataset_version,
            architecture=data.get('architecture', 'efficientnet_b0'),
            learning_rate=data.get('learning_rate', 0.001),
            max_epochs=data.get('max_epochs', 50),
            notes=data.get('notes')
        )
        
        return jsonify({
            "success": True,
            "experiment_id": experiment_id,
            "message": "Experiment created and scheduled"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Register blueprint
def register_ml_admin_routes(app):
    """Register ML admin routes with Flask app"""
    app.register_blueprint(ml_admin_bp)
