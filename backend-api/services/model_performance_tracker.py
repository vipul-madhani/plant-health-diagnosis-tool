"""
ML Model Performance Tracker
Tracks model accuracy, predictions, confidence scores, and performance metrics over time
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import numpy as np

class ModelPerformanceTracker:
    """
    Tracks ML model performance metrics for continuous monitoring and improvement
    """
    
    def __init__(self, base_path: str = "./ml-model/performance"):
        self.base_path = Path(base_path)
        self.predictions_file = self.base_path / "predictions.jsonl"
        self.metrics_file = self.base_path / "metrics.json"
        self.model_registry_file = self.base_path / "model_registry.json"
        
        # Create directories
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # Load or initialize registries
        self.model_registry = self._load_model_registry()
        self.metrics = self._load_metrics()
    
    def _load_model_registry(self) -> Dict:
        """Load model registry from disk"""
        if self.model_registry_file.exists():
            with open(self.model_registry_file, 'r') as f:
                return json.load(f)
        return {
            "models": [],
            "active_model_id": None
        }
    
    def _save_model_registry(self):
        """Save model registry to disk"""
        with open(self.model_registry_file, 'w') as f:
            json.dump(self.model_registry, f, indent=2)
    
    def _load_metrics(self) -> Dict:
        """Load metrics from disk"""
        if self.metrics_file.exists():
            with open(self.metrics_file, 'r') as f:
                return json.load(f)
        return {
            "overall": {
                "total_predictions": 0,
                "correct_predictions": 0,
                "accuracy": 0.0,
                "avg_confidence": 0.0
            },
            "per_class": {},
            "per_model": {},
            "daily_stats": {}
        }
    
    def _save_metrics(self):
        """Save metrics to disk"""
        with open(self.metrics_file, 'w') as f:
            json.dump(self.metrics, f, indent=2)
    
    def register_model(
        self,
        model_name: str,
        model_version: str,
        model_path: str,
        architecture: str,
        training_dataset: str,
        hyperparameters: Dict,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Register a new model version
        Returns model_id
        """
        model_id = f"{model_name}_{model_version}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        model_info = {
            "model_id": model_id,
            "name": model_name,
            "version": model_version,
            "path": model_path,
            "architecture": architecture,
            "training_dataset": training_dataset,
            "hyperparameters": hyperparameters,
            "registered_at": datetime.now().isoformat(),
            "status": "inactive",
            "metadata": metadata or {}
        }
        
        self.model_registry["models"].append(model_info)
        self._save_model_registry()
        
        # Initialize metrics for this model
        self.metrics["per_model"][model_id] = {
            "total_predictions": 0,
            "correct_predictions": 0,
            "accuracy": 0.0,
            "avg_confidence": 0.0,
            "inference_times": []
        }
        self._save_metrics()
        
        return model_id
    
    def set_active_model(self, model_id: str):
        """Set a model as active for serving predictions"""
        # Deactivate all models
        for model in self.model_registry["models"]:
            model["status"] = "inactive"
        
        # Activate specified model
        model = next((m for m in self.model_registry["models"] if m["model_id"] == model_id), None)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        model["status"] = "active"
        model["activated_at"] = datetime.now().isoformat()
        
        self.model_registry["active_model_id"] = model_id
        self._save_model_registry()
    
    def log_prediction(
        self,
        model_id: str,
        image_id: str,
        predicted_class: str,
        confidence: float,
        all_predictions: List[Dict],
        inference_time_ms: float,
        metadata: Optional[Dict] = None,
        ground_truth: Optional[str] = None
    ):
        """
        Log a model prediction for tracking and analysis
        """
        prediction_record = {
            "timestamp": datetime.now().isoformat(),
            "model_id": model_id,
            "image_id": image_id,
            "predicted_class": predicted_class,
            "confidence": confidence,
            "all_predictions": all_predictions,
            "inference_time_ms": inference_time_ms,
            "ground_truth": ground_truth,
            "is_correct": predicted_class == ground_truth if ground_truth else None,
            "metadata": metadata or {}
        }
        
        # Append to predictions log (JSONL format)
        with open(self.predictions_file, 'a') as f:
            f.write(json.dumps(prediction_record) + '\n')
        
        # Update metrics
        self._update_metrics(prediction_record)
    
    def _update_metrics(self, prediction: Dict):
        """Update performance metrics based on new prediction"""
        model_id = prediction["model_id"]
        predicted_class = prediction["predicted_class"]
        confidence = prediction["confidence"]
        is_correct = prediction["is_correct"]
        inference_time = prediction["inference_time_ms"]
        
        # Update overall metrics
        self.metrics["overall"]["total_predictions"] += 1
        
        if is_correct is not None:
            if is_correct:
                self.metrics["overall"]["correct_predictions"] += 1
            
            # Recalculate accuracy
            total = self.metrics["overall"]["total_predictions"]
            correct = self.metrics["overall"]["correct_predictions"]
            self.metrics["overall"]["accuracy"] = round(correct / total, 4) if total > 0 else 0.0
        
        # Update average confidence (running average)
        current_avg = self.metrics["overall"]["avg_confidence"]
        total = self.metrics["overall"]["total_predictions"]
        self.metrics["overall"]["avg_confidence"] = round(
            (current_avg * (total - 1) + confidence) / total, 4
        )
        
        # Update per-class metrics
        if predicted_class not in self.metrics["per_class"]:
            self.metrics["per_class"][predicted_class] = {
                "total_predictions": 0,
                "correct_predictions": 0,
                "accuracy": 0.0,
                "avg_confidence": 0.0,
                "false_positives": 0,
                "false_negatives": 0
            }
        
        class_metrics = self.metrics["per_class"][predicted_class]
        class_metrics["total_predictions"] += 1
        
        if is_correct is not None:
            if is_correct:
                class_metrics["correct_predictions"] += 1
            else:
                class_metrics["false_positives"] += 1
                
                # Track false negative for ground truth class
                if prediction["ground_truth"]:
                    gt_class = prediction["ground_truth"]
                    if gt_class not in self.metrics["per_class"]:
                        self.metrics["per_class"][gt_class] = {
                            "total_predictions": 0,
                            "correct_predictions": 0,
                            "accuracy": 0.0,
                            "avg_confidence": 0.0,
                            "false_positives": 0,
                            "false_negatives": 0
                        }
                    self.metrics["per_class"][gt_class]["false_negatives"] += 1
            
            # Recalculate class accuracy
            total = class_metrics["total_predictions"]
            correct = class_metrics["correct_predictions"]
            class_metrics["accuracy"] = round(correct / total, 4) if total > 0 else 0.0
        
        # Update class confidence
        current_avg = class_metrics["avg_confidence"]
        total = class_metrics["total_predictions"]
        class_metrics["avg_confidence"] = round(
            (current_avg * (total - 1) + confidence) / total, 4
        )
        
        # Update per-model metrics
        if model_id not in self.metrics["per_model"]:
            self.metrics["per_model"][model_id] = {
                "total_predictions": 0,
                "correct_predictions": 0,
                "accuracy": 0.0,
                "avg_confidence": 0.0,
                "inference_times": []
            }
        
        model_metrics = self.metrics["per_model"][model_id]
        model_metrics["total_predictions"] += 1
        
        if is_correct is not None:
            if is_correct:
                model_metrics["correct_predictions"] += 1
            
            total = model_metrics["total_predictions"]
            correct = model_metrics["correct_predictions"]
            model_metrics["accuracy"] = round(correct / total, 4) if total > 0 else 0.0
        
        # Update model confidence
        current_avg = model_metrics["avg_confidence"]
        total = model_metrics["total_predictions"]
        model_metrics["avg_confidence"] = round(
            (current_avg * (total - 1) + confidence) / total, 4
        )
        
        # Track inference times (keep last 1000)
        model_metrics["inference_times"].append(inference_time)
        if len(model_metrics["inference_times"]) > 1000:
            model_metrics["inference_times"] = model_metrics["inference_times"][-1000:]
        
        # Update daily stats
        today = datetime.now().strftime("%Y-%m-%d")
        if today not in self.metrics["daily_stats"]:
            self.metrics["daily_stats"][today] = {
                "total_predictions": 0,
                "correct_predictions": 0,
                "accuracy": 0.0,
                "avg_confidence": 0.0
            }
        
        daily = self.metrics["daily_stats"][today]
        daily["total_predictions"] += 1
        
        if is_correct is not None:
            if is_correct:
                daily["correct_predictions"] += 1
            
            total = daily["total_predictions"]
            correct = daily["correct_predictions"]
            daily["accuracy"] = round(correct / total, 4) if total > 0 else 0.0
        
        current_avg = daily["avg_confidence"]
        total = daily["total_predictions"]
        daily["avg_confidence"] = round(
            (current_avg * (total - 1) + confidence) / total, 4
        )
        
        self._save_metrics()
    
    def get_overall_metrics(self) -> Dict:
        """Get overall performance metrics"""
        return self.metrics["overall"]
    
    def get_class_metrics(self, class_name: Optional[str] = None) -> Dict:
        """Get per-class metrics"""
        if class_name:
            return self.metrics["per_class"].get(class_name, {})
        return self.metrics["per_class"]
    
    def get_model_metrics(self, model_id: Optional[str] = None) -> Dict:
        """Get per-model metrics"""
        if model_id:
            metrics = self.metrics["per_model"].get(model_id, {})
            if metrics and "inference_times" in metrics:
                times = metrics["inference_times"]
                if times:
                    metrics["avg_inference_time_ms"] = round(np.mean(times), 2)
                    metrics["p50_inference_time_ms"] = round(np.percentile(times, 50), 2)
                    metrics["p95_inference_time_ms"] = round(np.percentile(times, 95), 2)
                    metrics["p99_inference_time_ms"] = round(np.percentile(times, 99), 2)
            return metrics
        
        # Return all models with calculated stats
        all_models = {}
        for mid, metrics in self.metrics["per_model"].items():
            all_models[mid] = self.get_model_metrics(mid)
        return all_models
    
    def get_daily_trends(self, days: int = 30) -> Dict:
        """Get performance trends over last N days"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        trends = {}
        for date_str, stats in self.metrics["daily_stats"].items():
            date = datetime.fromisoformat(date_str + "T00:00:00")
            if start_date <= date <= end_date:
                trends[date_str] = stats
        
        return dict(sorted(trends.items()))
    
    def get_confusion_matrix(self, classes: List[str]) -> Dict:
        """Generate confusion matrix from logged predictions"""
        matrix = {c: {c2: 0 for c2 in classes} for c in classes}
        
        if not self.predictions_file.exists():
            return matrix
        
        with open(self.predictions_file, 'r') as f:
            for line in f:
                pred = json.loads(line)
                if pred["ground_truth"] and pred["predicted_class"]:
                    gt = pred["ground_truth"]
                    pred_class = pred["predicted_class"]
                    if gt in classes and pred_class in classes:
                        matrix[gt][pred_class] += 1
        
        return matrix
    
    def get_low_confidence_predictions(self, threshold: float = 0.7, limit: int = 100) -> List[Dict]:
        """Get predictions with confidence below threshold"""
        low_confidence = []
        
        if not self.predictions_file.exists():
            return low_confidence
        
        with open(self.predictions_file, 'r') as f:
            for line in f:
                pred = json.loads(line)
                if pred["confidence"] < threshold:
                    low_confidence.append(pred)
                    if len(low_confidence) >= limit:
                        break
        
        return low_confidence
    
    def detect_performance_drift(self, window_size: int = 100) -> Dict:
        """
        Detect if model performance is degrading
        Compares recent predictions to historical average
        """
        if not self.predictions_file.exists():
            return {"drift_detected": False, "message": "Insufficient data"}
        
        predictions = []
        with open(self.predictions_file, 'r') as f:
            for line in f:
                pred = json.loads(line)
                if pred["is_correct"] is not None:
                    predictions.append(pred)
        
        if len(predictions) < window_size * 2:
            return {"drift_detected": False, "message": "Insufficient labeled data"}
        
        # Calculate historical accuracy (excluding recent window)
        historical = predictions[:-window_size]
        recent = predictions[-window_size:]
        
        historical_accuracy = sum(1 for p in historical if p["is_correct"]) / len(historical)
        recent_accuracy = sum(1 for p in recent if p["is_correct"]) / len(recent)
        
        # Detect significant drop (more than 5% decrease)
        drift_threshold = 0.05
        drift_detected = (historical_accuracy - recent_accuracy) > drift_threshold
        
        return {
            "drift_detected": drift_detected,
            "historical_accuracy": round(historical_accuracy, 4),
            "recent_accuracy": round(recent_accuracy, 4),
            "accuracy_drop": round(historical_accuracy - recent_accuracy, 4),
            "threshold": drift_threshold,
            "recommendation": "Consider retraining model with recent data" if drift_detected else "Performance stable"
        }
    
    def get_active_model(self) -> Optional[Dict]:
        """Get currently active model info"""
        active_id = self.model_registry.get("active_model_id")
        if not active_id:
            return None
        
        return next((m for m in self.model_registry["models"] if m["model_id"] == active_id), None)
    
    def list_models(self) -> List[Dict]:
        """List all registered models"""
        return self.model_registry["models"]
