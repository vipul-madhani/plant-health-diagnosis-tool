import numpy as np
from typing import Tuple, Dict, List
from sklearn.metrics import (
    confusion_matrix, classification_report, accuracy_score,
    precision_score, recall_score, f1_score, roc_auc_score
)
import matplotlib.pyplot as plt
import seaborn as sns
from model import PlantHealthModel


class ModelEvaluator:
    """
    Evaluation metrics and visualization for the plant health model.
    
    Provides:
    - Accuracy, precision, recall, F1-score metrics
    - Confusion matrix generation
    - ROC-AUC analysis
    - Classification reports
    - Visualization tools
    """
    
    def __init__(self, model_handler: PlantHealthModel):
        """
        Initialize the evaluator.
        
        Args:
            model_handler: PlantHealthModel instance
        """
        self.model_handler = model_handler
        self.metrics = {}
        
    def evaluate(
        self,
        test_images: np.ndarray,
        test_labels_disease: np.ndarray,
        test_labels_species: np.ndarray
    ) -> Dict:
        """
        Evaluate model on test data.
        
        Args:
            test_images: Test images
            test_labels_disease: Ground truth disease labels (one-hot encoded)
            test_labels_species: Ground truth species labels (one-hot encoded)
            
        Returns:
            Dictionary of evaluation metrics
        """
        print("\n[EVAL] Starting model evaluation...")
        
        # Get predictions
        disease_pred, species_pred = self.model_handler.get_model().predict(test_images)
        
        # Convert from one-hot to class indices
        disease_true = np.argmax(test_labels_disease, axis=1)
        disease_pred_class = np.argmax(disease_pred, axis=1)
        
        species_true = np.argmax(test_labels_species, axis=1)
        species_pred_class = np.argmax(species_pred, axis=1)
        
        # Calculate metrics for disease diagnosis
        disease_metrics = self._calculate_metrics(
            disease_true,
            disease_pred_class,
            disease_pred,
            task="Disease Diagnosis"
        )
        
        # Calculate metrics for species identification
        species_metrics = self._calculate_metrics(
            species_true,
            species_pred_class,
            species_pred,
            task="Species Identification"
        )
        
        self.metrics = {
            'disease': disease_metrics,
            'species': species_metrics,
            'test_samples': len(test_images)
        }
        
        print("\n[EVAL] Evaluation complete!")
        return self.metrics
    
    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: np.ndarray,
        task: str = "Task"
    ) -> Dict:
        """
        Calculate comprehensive evaluation metrics.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Prediction probabilities
            task: Task name for printing
            
        Returns:
            Dictionary of metrics
        """
        accuracy = accuracy_score(y_true, y_pred)
        precision_macro = precision_score(y_true, y_pred, average='macro', zero_division=0)
        recall_macro = recall_score(y_true, y_pred, average='macro', zero_division=0)
        f1_macro = f1_score(y_true, y_pred, average='macro', zero_division=0)
        
        print(f"\n[{task}] Metrics:")
        print(f"  Accuracy:  {accuracy:.4f}")
        print(f"  Precision: {precision_macro:.4f}")
        print(f"  Recall:    {recall_macro:.4f}")
        print(f"  F1-Score:  {f1_macro:.4f}")
        
        # Try ROC-AUC for multi-class
        try:
            roc_auc = roc_auc_score(y_true, y_pred_proba, multi_class='ovr', average='macro')
            print(f"  ROC-AUC:   {roc_auc:.4f}")
        except Exception as e:
            roc_auc = None
            print(f"  ROC-AUC:   N/A ({str(e)})")
        
        # Per-class metrics
        class_report = classification_report(
            y_true, y_pred,
            output_dict=True,
            zero_division=0
        )
        
        return {
            'accuracy': float(accuracy),
            'precision': float(precision_macro),
            'recall': float(recall_macro),
            'f1_score': float(f1_macro),
            'roc_auc': float(roc_auc) if roc_auc else None,
            'classification_report': class_report
        }
    
    def get_confusion_matrix(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray
    ) -> np.ndarray:
        """
        Get confusion matrix.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            
        Returns:
            Confusion matrix
        """
        return confusion_matrix(y_true, y_pred)
    
    def plot_confusion_matrix(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        class_names: List[str] = None,
        save_path: str = None
    ):
        """
        Plot and optionally save confusion matrix.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            class_names: Names of classes for axis labels
            save_path: Path to save the figure
        """
        cm = self.get_confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=class_names,
                   yticklabels=class_names)
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.title('Confusion Matrix')
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"[PLOT] Confusion matrix saved to {save_path}")
        
        plt.show()
    
    def print_evaluation_summary(self):
        """
        Print comprehensive evaluation summary.
        """
        if not self.metrics:
            print("[ERROR] No metrics available. Run evaluate() first.")
            return
        
        print("\n" + "="*60)
        print("MODEL EVALUATION SUMMARY")
        print("="*60)
        
        print(f"\nTest Samples: {self.metrics['test_samples']}")
        
        print("\n--- DISEASE DIAGNOSIS ---")
        for key, value in self.metrics['disease'].items():
            if key != 'classification_report':
                print(f"{key}: {value}")
        
        print("\n--- SPECIES IDENTIFICATION ---")
        for key, value in self.metrics['species'].items():
            if key != 'classification_report':
                print(f"{key}: {value}")
        
        print("\n" + "="*60)
    
    def get_prediction(self, image: np.ndarray) -> Tuple[str, str, float, float]:
        """
        Get prediction for a single image.
        
        Args:
            image: Input image (H, W, 3)
            
        Returns:
            Tuple of (disease_class, species_class, disease_confidence, species_confidence)
        """
        disease_pred, species_pred = self.model_handler.predict(image)
        
        disease_idx = np.argmax(disease_pred)
        disease_conf = float(disease_pred[disease_idx])
        
        species_idx = np.argmax(species_pred)
        species_conf = float(species_pred[species_idx])
        
        return (disease_idx, species_idx, disease_conf, species_conf)


if __name__ == "__main__":
    # Example usage
    print("Model Evaluator initialized successfully!")
    print("Use with TrainingPipeline for comprehensive model evaluation.")
