"""
ML Retraining Orchestrator
Automated training pipeline for continuous model improvement
Handles training job scheduling, experiment tracking, and model versioning
"""

import json
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from enum import Enum
import threading
import time

class TrainingStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class RetrainingOrchestrator:
    """
    Orchestrates ML model retraining with automated scheduling and experiment tracking
    """
    
    def __init__(self, base_path: str = "./ml-model"):
        self.base_path = Path(base_path)
        self.experiments_dir = self.base_path / "experiments"
        self.experiments_file = self.experiments_dir / "experiments.json"
        self.config_dir = self.base_path / "configs"
        
        # Create directories
        self.experiments_dir.mkdir(parents=True, exist_ok=True)
        self.config_dir.mkdir(exist_ok=True)
        
        # Load experiments
        self.experiments = self._load_experiments()
        
        # Training queue
        self.training_queue = []
        self.current_training = None
    
    def _load_experiments(self) -> Dict:
        """Load experiment history"""
        if self.experiments_file.exists():
            with open(self.experiments_file, 'r') as f:
                return json.load(f)
        return {"experiments": [], "next_id": 1}
    
    def _save_experiments(self):
        """Save experiment history"""
        with open(self.experiments_file, 'w') as f:
            json.dump(self.experiments, f, indent=2)
    
    def create_training_config(
        self,
        config_name: str,
        architecture: str,
        hyperparameters: Dict,
        dataset_version: str,
        augmentation: Optional[Dict] = None,
        optimizer_config: Optional[Dict] = None,
        notes: Optional[str] = None
    ) -> str:
        """
        Create a training configuration
        Returns config_id
        """
        config = {
            "name": config_name,
            "architecture": architecture,
            "hyperparameters": hyperparameters,
            "dataset_version": dataset_version,
            "augmentation": augmentation or self._default_augmentation(),
            "optimizer": optimizer_config or self._default_optimizer(),
            "created_at": datetime.now().isoformat(),
            "notes": notes
        }
        
        # Save config to file
        config_file = self.config_dir / f"{config_name}.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        return config_name
    
    def _default_augmentation(self) -> Dict:
        """Default data augmentation config"""
        return {
            "horizontal_flip": True,
            "vertical_flip": False,
            "rotation_range": 15,
            "zoom_range": 0.1,
            "brightness_range": [0.8, 1.2],
            "fill_mode": "nearest"
        }
    
    def _default_optimizer(self) -> Dict:
        """Default optimizer config"""
        return {
            "name": "adam",
            "learning_rate": 0.001,
            "beta_1": 0.9,
            "beta_2": 0.999,
            "epsilon": 1e-07
        }
    
    def schedule_training(
        self,
        config_name: str,
        priority: int = 5,
        gpu_required: bool = False,
        max_epochs: int = 50,
        early_stopping_patience: int = 5,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Schedule a training job
        Returns experiment_id
        """
        experiment_id = f"exp_{self.experiments['next_id']:04d}"
        self.experiments['next_id'] += 1
        
        experiment = {
            "experiment_id": experiment_id,
            "config_name": config_name,
            "status": TrainingStatus.PENDING.value,
            "priority": priority,
            "gpu_required": gpu_required,
            "max_epochs": max_epochs,
            "early_stopping_patience": early_stopping_patience,
            "scheduled_at": datetime.now().isoformat(),
            "started_at": None,
            "completed_at": None,
            "metrics": {},
            "model_path": None,
            "metadata": metadata or {},
            "error": None
        }
        
        self.experiments["experiments"].append(experiment)
        self._save_experiments()
        
        # Add to queue (sorted by priority)
        self.training_queue.append(experiment_id)
        self.training_queue.sort(
            key=lambda x: next((e["priority"] for e in self.experiments["experiments"] if e["experiment_id"] == x), 999),
            reverse=True
        )
        
        return experiment_id
    
    def start_training(self, experiment_id: str) -> bool:
        """
        Start a training job
        Returns True if started successfully
        """
        experiment = self._get_experiment(experiment_id)
        if not experiment:
            return False
        
        if experiment["status"] != TrainingStatus.PENDING.value:
            return False
        
        # Update status
        experiment["status"] = TrainingStatus.RUNNING.value
        experiment["started_at"] = datetime.now().isoformat()
        self._save_experiments()
        
        # Start training in background thread
        thread = threading.Thread(
            target=self._run_training,
            args=(experiment_id,),
            daemon=True
        )
        thread.start()
        
        self.current_training = experiment_id
        return True
    
    def _run_training(self, experiment_id: str):
        """
        Execute training process
        """
        experiment = self._get_experiment(experiment_id)
        if not experiment:
            return
        
        try:
            # Load config
            config_file = self.config_dir / f"{experiment['config_name']}.json"
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            # Create experiment directory
            exp_dir = self.experiments_dir / experiment_id
            exp_dir.mkdir(exist_ok=True)
            
            # Save experiment config
            with open(exp_dir / "config.json", 'w') as f:
                json.dump({
                    "experiment": experiment,
                    "config": config
                }, f, indent=2)
            
            # Build training command
            train_script = self.base_path / "train.py"
            
            cmd = [
                "python",
                str(train_script),
                "--config", str(config_file),
                "--output_dir", str(exp_dir),
                "--max_epochs", str(experiment["max_epochs"]),
                "--early_stopping_patience", str(experiment["early_stopping_patience"])
            ]
            
            if experiment["gpu_required"]:
                cmd.extend(["--gpu", "true"])
            
            # Run training
            print(f"Starting training for {experiment_id}...")
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate()
            
            # Save logs
            with open(exp_dir / "stdout.log", 'w') as f:
                f.write(stdout)
            with open(exp_dir / "stderr.log", 'w') as f:
                f.write(stderr)
            
            if process.returncode == 0:
                # Training successful
                experiment["status"] = TrainingStatus.COMPLETED.value
                experiment["completed_at"] = datetime.now().isoformat()
                
                # Load training metrics
                metrics_file = exp_dir / "metrics.json"
                if metrics_file.exists():
                    with open(metrics_file, 'r') as f:
                        experiment["metrics"] = json.load(f)
                
                # Set model path
                model_file = exp_dir / "best_model.h5"  # or .pth for PyTorch
                if model_file.exists():
                    experiment["model_path"] = str(model_file)
                
                print(f"Training completed for {experiment_id}")
            else:
                # Training failed
                experiment["status"] = TrainingStatus.FAILED.value
                experiment["completed_at"] = datetime.now().isoformat()
                experiment["error"] = stderr[:1000]  # First 1000 chars of error
                print(f"Training failed for {experiment_id}: {stderr[:200]}")
            
        except Exception as e:
            experiment["status"] = TrainingStatus.FAILED.value
            experiment["completed_at"] = datetime.now().isoformat()
            experiment["error"] = str(e)
            print(f"Training error for {experiment_id}: {str(e)}")
        
        finally:
            self._save_experiments()
            self.current_training = None
    
    def _get_experiment(self, experiment_id: str) -> Optional[Dict]:
        """Get experiment by ID"""
        return next(
            (e for e in self.experiments["experiments"] if e["experiment_id"] == experiment_id),
            None
        )
    
    def get_experiment_status(self, experiment_id: str) -> Optional[Dict]:
        """Get experiment status and metrics"""
        return self._get_experiment(experiment_id)
    
    def list_experiments(
        self,
        status: Optional[TrainingStatus] = None,
        limit: int = 50
    ) -> List[Dict]:
        """List experiments with optional status filter"""
        experiments = self.experiments["experiments"]
        
        if status:
            experiments = [e for e in experiments if e["status"] == status.value]
        
        # Sort by scheduled time (most recent first)
        experiments.sort(key=lambda x: x["scheduled_at"], reverse=True)
        
        return experiments[:limit]
    
    def cancel_training(self, experiment_id: str) -> bool:
        """Cancel a pending or running training job"""
        experiment = self._get_experiment(experiment_id)
        if not experiment:
            return False
        
        if experiment["status"] == TrainingStatus.PENDING.value:
            experiment["status"] = TrainingStatus.CANCELLED.value
            self.training_queue.remove(experiment_id)
            self._save_experiments()
            return True
        
        if experiment["status"] == TrainingStatus.RUNNING.value:
            # In production, would kill training process
            experiment["status"] = TrainingStatus.CANCELLED.value
            self._save_experiments()
            return True
        
        return False
    
    def compare_experiments(
        self,
        experiment_ids: List[str],
        metric: str = "val_accuracy"
    ) -> Dict:
        """Compare metrics across experiments"""
        comparison = {
            "metric": metric,
            "experiments": []
        }
        
        for exp_id in experiment_ids:
            exp = self._get_experiment(exp_id)
            if exp and exp["metrics"]:
                comparison["experiments"].append({
                    "experiment_id": exp_id,
                    "status": exp["status"],
                    "metric_value": exp["metrics"].get(metric),
                    "config": exp["config_name"],
                    "completed_at": exp["completed_at"]
                })
        
        # Sort by metric value (descending)
        comparison["experiments"].sort(
            key=lambda x: x["metric_value"] if x["metric_value"] is not None else -1,
            reverse=True
        )
        
        return comparison
    
    def get_best_model(self, metric: str = "val_accuracy") -> Optional[Dict]:
        """Get the best performing model based on metric"""
        completed = [
            e for e in self.experiments["experiments"]
            if e["status"] == TrainingStatus.COMPLETED.value and e["metrics"]
        ]
        
        if not completed:
            return None
        
        best = max(
            completed,
            key=lambda x: x["metrics"].get(metric, -1)
        )
        
        return best
    
    def auto_retrain_check(
        self,
        accuracy_threshold: float = 0.90,
        min_new_samples: int = 1000
    ) -> Dict:
        """
        Check if model should be retrained based on criteria
        Returns recommendation
        """
        from backend-api.services.model_performance_tracker import ModelPerformanceTracker
        
        tracker = ModelPerformanceTracker()
        
        # Get current model performance
        overall_metrics = tracker.get_overall_metrics()
        current_accuracy = overall_metrics.get("accuracy", 0.0)
        
        # Check for performance drift
        drift_info = tracker.detect_performance_drift()
        
        recommendation = {
            "should_retrain": False,
            "reasons": [],
            "current_accuracy": current_accuracy,
            "threshold": accuracy_threshold
        }
        
        # Check accuracy threshold
        if current_accuracy < accuracy_threshold:
            recommendation["should_retrain"] = True
            recommendation["reasons"].append(
                f"Accuracy {current_accuracy:.4f} below threshold {accuracy_threshold}"
            )
        
        # Check for drift
        if drift_info.get("drift_detected"):
            recommendation["should_retrain"] = True
            recommendation["reasons"].append(
                f"Performance drift detected: {drift_info.get('accuracy_drop', 0):.4f} drop"
            )
        
        # Check for new data availability
        # This would integrate with DatasetManager to check staging area
        # For now, placeholder
        recommendation["reasons"].append(
            "Check dataset manager for new samples availability"
        )
        
        return recommendation
    
    def create_quick_experiment(
        self,
        dataset_version: str,
        architecture: str = "efficientnet_b0",
        learning_rate: float = 0.001,
        max_epochs: int = 50,
        notes: Optional[str] = None
    ) -> str:
        """
        Quick helper to create and schedule a standard training experiment
        Returns experiment_id
        """
        # Create config
        config_name = f"config_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        hyperparameters = {
            "batch_size": 32,
            "image_size": 224,
            "dropout_rate": 0.2,
            "learning_rate": learning_rate
        }
        
        self.create_training_config(
            config_name=config_name,
            architecture=architecture,
            hyperparameters=hyperparameters,
            dataset_version=dataset_version,
            notes=notes
        )
        
        # Schedule training
        experiment_id = self.schedule_training(
            config_name=config_name,
            max_epochs=max_epochs,
            gpu_required=True
        )
        
        return experiment_id

# Singleton instance
_orchestrator = None

def get_retraining_orchestrator() -> RetrainingOrchestrator:
    """Get or create orchestrator singleton"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = RetrainingOrchestrator()
    return _orchestrator
