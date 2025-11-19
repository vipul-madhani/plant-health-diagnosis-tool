import os
import json
import numpy as np
from pathlib import Path
from typing import Tuple, List, Dict
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint,
    TensorBoard
)
from datetime import datetime

from model import PlantHealthModel
from data_loader import DataLoader
from evaluate import ModelEvaluator


class TrainingPipeline:
    """
    Complete training pipeline for the plant health diagnosis model.
    
    Features:
    - Data loading and preprocessing
    - Model training with early stopping
    - Learning rate scheduling
    - Model checkpointing
    - Training metrics tracking
    - Model evaluation and validation
    """
    
    def __init__(
        self,
        dataset_path: str,
        output_dir: str = "./trained_models",
        batch_size: int = 32,
        epochs: int = 50,
        validation_split: float = 0.2
    ):
        """
        Initialize the training pipeline.
        
        Args:
            dataset_path: Path to the dataset directory
            output_dir: Directory to save trained models
            batch_size: Batch size for training
            epochs: Maximum number of training epochs
            validation_split: Fraction of data to use for validation
        """
        self.dataset_path = dataset_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.batch_size = batch_size
        self.epochs = epochs
        self.validation_split = validation_split
        
        self.model_handler = None
        self.data_loader = None
        self.evaluator = None
        self.history = None
        self.training_log = {}
        
    def setup(self):
        """
        Set up all pipeline components.
        """
        print("[SETUP] Initializing training pipeline components...")
        
        # Initialize model
        self.model_handler = PlantHealthModel()
        self.model_handler.build_model(pretrained=True)
        
        # Initialize data loader
        self.data_loader = DataLoader(self.dataset_path)
        self.data_loader.prepare_data()
        
        # Initialize evaluator
        self.evaluator = ModelEvaluator(self.model_handler)
        
        print("[SETUP] Pipeline setup complete!")
    
    def get_callbacks(self) -> List[keras.callbacks.Callback]:
        """
        Create training callbacks.
        
        Returns:
            List of Keras callbacks
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        checkpoint_path = self.output_dir / f"model_checkpoint_{timestamp}.h5"
        log_dir = self.output_dir / f"logs_{timestamp}"
        
        callbacks = [
            # Early stopping to prevent overfitting
            EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True,
                verbose=1
            ),
            # Learning rate reduction on plateau
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7,
                verbose=1
            ),
            # Model checkpointing
            ModelCheckpoint(
                str(checkpoint_path),
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            # TensorBoard logging
            TensorBoard(
                log_dir=str(log_dir),
                histogram_freq=1,
                write_graph=True,
                update_freq='epoch'
            )
        ]
        
        return callbacks
    
    def train(
        self,
        train_images: np.ndarray,
        train_labels_disease: np.ndarray,
        train_labels_species: np.ndarray,
        val_images: np.ndarray = None,
        val_labels_disease: np.ndarray = None,
        val_labels_species: np.ndarray = None
    ) -> Dict:
        """
        Train the model.
        
        Args:
            train_images: Training images
            train_labels_disease: Disease labels
            train_labels_species: Species labels
            val_images: Validation images (optional)
            val_labels_disease: Validation disease labels (optional)
            val_labels_species: Validation species labels (optional)
            
        Returns:
            Training history dictionary
        """
        print("\n[TRAINING] Starting model training...")
        print(f"Training samples: {len(train_images)}")
        
        if val_images is None:
            print(f"[TRAINING] Using {self.validation_split*100}% of training data for validation")
        else:
            print(f"[TRAINING] Using provided validation set ({len(val_images)} samples)")
        
        callbacks = self.get_callbacks()
        
        self.history = self.model_handler.get_model().fit(
            train_images,
            {
                'disease_diagnosis': train_labels_disease,
                'species_identification': train_labels_species
            },
            batch_size=self.batch_size,
            epochs=self.epochs,
            validation_data=(
                val_images,
                {
                    'disease_diagnosis': val_labels_disease,
                    'species_identification': val_labels_species
                }
            ) if val_images is not None else None,
            validation_split=self.validation_split if val_images is None else None,
            callbacks=callbacks,
            verbose=1
        )
        
        print("[TRAINING] Training complete!")
        return self.history.history
    
    def fine_tune(
        self,
        train_images: np.ndarray,
        train_labels_disease: np.ndarray,
        train_labels_species: np.ndarray,
        num_layers: int = 50,
        epochs: int = 20
    ):
        """
        Fine-tune the model by unfreezing base layers.
        
        Args:
            train_images: Training images
            train_labels_disease: Disease labels
            train_labels_species: Species labels
            num_layers: Number of layers to unfreeze
            epochs: Number of fine-tuning epochs
        """
        print(f"\n[FINE-TUNING] Unfreezing last {num_layers} layers...")
        self.model_handler.unfreeze_base(num_layers=num_layers)
        
        print("[FINE-TUNING] Starting fine-tuning...")
        callbacks = self.get_callbacks()
        
        history = self.model_handler.get_model().fit(
            train_images,
            {
                'disease_diagnosis': train_labels_disease,
                'species_identification': train_labels_species
            },
            batch_size=self.batch_size,
            epochs=epochs,
            validation_split=self.validation_split,
            callbacks=callbacks,
            verbose=1
        )
        
        print("[FINE-TUNING] Fine-tuning complete!")
        return history.history
    
    def save_model(self, name: str = "plant_health_model"):
        """
        Save the trained model.
        
        Args:
            name: Model name (without extension)
        """
        if self.model_handler is None or self.model_handler.model is None:
            raise ValueError("No model to save. Train the model first.")
        
        model_path = self.output_dir / f"{name}.h5"
        self.model_handler.model.save(str(model_path))
        print(f"[SAVE] Model saved to {model_path}")
        
        return model_path
    
    def save_weights(self, name: str = "plant_health_weights"):
        """
        Save model weights.
        
        Args:
            name: Weights file name (without extension)
        """
        if self.model_handler is None or self.model_handler.model is None:
            raise ValueError("No model weights to save. Train the model first.")
        
        weights_path = self.output_dir / f"{name}.weights.h5"
        self.model_handler.model.save_weights(str(weights_path))
        print(f"[SAVE] Weights saved to {weights_path}")
        
        return weights_path
    
    def log_training_info(self, info_dict: Dict):
        """
        Log training information to JSON.
        
        Args:
            info_dict: Information to log
        """
        self.training_log.update(info_dict)
        
        log_path = self.output_dir / "training_log.json"
        with open(log_path, 'w') as f:
            json.dump(self.training_log, f, indent=2, default=str)
        
        print(f"[LOG] Training info saved to {log_path}")


if __name__ == "__main__":
    # Example usage
    print("=" * 60)
    print("Plant Health Diagnosis Model - Training Pipeline")
    print("=" * 60)
    
    # Initialize pipeline
    pipeline = TrainingPipeline(
        dataset_path="./data",
        output_dir="./trained_models",
        batch_size=32,
        epochs=50
    )
    
    # Setup pipeline
    pipeline.setup()
    
    # Load data (this would use actual data in production)
    print("\n[INFO] Use DataLoader to load your training data")
    print("[INFO] Then call pipeline.train() with the loaded data")
    print("[INFO] Finally save the model using pipeline.save_model()")
    
    print("\n" + "=" * 60)
    print("Training pipeline ready for use!")
    print("=" * 60)
