import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from typing import Tuple


class PlantHealthModel:
    """
    ResNet50-based model for plant health diagnosis.
    
    Architecture:
    - Input: 224x224 RGB images
    - Base: ResNet50 (pre-trained on ImageNet)
    - Outputs:
      1. Primary Diagnosis: Disease classification (12 classes)
      2. Secondary: Plant species identification (50+ classes)
      3. Confidence scores for predictions
    """
    
    def __init__(self, input_shape: Tuple[int, int, int] = (224, 224, 3)):
        """
        Initialize the plant health diagnosis model.
        
        Args:
            input_shape: Input image dimensions (height, width, channels)
        """
        self.input_shape = input_shape
        self.disease_classes = 12
        self.species_classes = 50
        self.model = None
        
    def build_model(self, pretrained: bool = True) -> keras.Model:
        """
        Build the dual-output neural network model.
        
        Args:
            pretrained: Whether to use ImageNet pre-trained weights
            
        Returns:
            Compiled Keras model
        """
        # Load base ResNet50 model
        base_model = keras.applications.ResNet50(
            weights='imagenet' if pretrained else None,
            include_top=False,
            input_shape=self.input_shape
        )
        
        # Freeze base model layers
        base_model.trainable = False
        
        # Create input layer
        inputs = keras.Input(shape=self.input_shape)
        
        # Preprocess input for ResNet50
        x = keras.applications.resnet50.preprocess_input(inputs)
        
        # Pass through base model
        x = base_model(x, training=False)
        
        # Global average pooling
        x = layers.GlobalAveragePooling2D()(x)
        
        # Shared dense layers
        x = layers.Dense(512, activation='relu')(x)
        x = layers.Dropout(0.4)(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(0.3)(x)
        
        # Disease diagnosis output
        disease_output = layers.Dense(
            self.disease_classes,
            activation='softmax',
            name='disease_diagnosis'
        )(x)
        
        # Species identification output
        species_output = layers.Dense(
            self.species_classes,
            activation='softmax',
            name='species_identification'
        )(x)
        
        # Create model with multiple outputs
        model = keras.Model(
            inputs=inputs,
            outputs=[disease_output, species_output]
        )
        
        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss={
                'disease_diagnosis': 'categorical_crossentropy',
                'species_identification': 'categorical_crossentropy'
            },
            loss_weights={
                'disease_diagnosis': 0.7,
                'species_identification': 0.3
            },
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def get_model(self) -> keras.Model:
        """
        Get the compiled model. Builds if not already built.
        
        Returns:
            Compiled Keras model
        """
        if self.model is None:
            self.build_model()
        return self.model
    
    def unfreeze_base(self, num_layers: int = 50):
        """
        Unfreeze the last N layers of the base model for fine-tuning.
        
        Args:
            num_layers: Number of layers to unfreeze from the end
        """
        if self.model is None:
            raise ValueError("Model must be built first")
            
        base_model = self.model.layers[1]
        
        # Unfreeze the last N layers
        for layer in base_model.layers[-num_layers:]:
            layer.trainable = True
        
        # Recompile with lower learning rate for fine-tuning
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss={
                'disease_diagnosis': 'categorical_crossentropy',
                'species_identification': 'categorical_crossentropy'
            },
            loss_weights={
                'disease_diagnosis': 0.7,
                'species_identification': 0.3
            },
            metrics=['accuracy']
        )
    
    def predict(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions on a single image.
        
        Args:
            image: Input image array (H, W, 3)
            
        Returns:
            Tuple of (disease_predictions, species_predictions)
        """
        if self.model is None:
            raise ValueError("Model must be built first")
        
        # Add batch dimension
        image_batch = np.expand_dims(image, axis=0)
        
        # Get predictions
        disease_pred, species_pred = self.model.predict(image_batch)
        
        return disease_pred[0], species_pred[0]
    
    def get_model_summary(self) -> str:
        """
        Get a text summary of the model architecture.
        
        Returns:
            Model summary as string
        """
        if self.model is None:
            raise ValueError("Model must be built first")
        
        from io import StringIO
        import sys
        
        # Capture model summary
        stream = StringIO()
        self.model.summary(print_fn=lambda x: stream.write(x + '\n'))
        
        return stream.getvalue()


if __name__ == "__main__":
    # Example usage
    model_handler = PlantHealthModel()
    model = model_handler.build_model()
    
    print("Model successfully built!")
    print(f"Input shape: {model_handler.input_shape}")
    print(f"Disease classes: {model_handler.disease_classes}")
    print(f"Species classes: {model_handler.species_classes}")
    print("\nModel Architecture:")
    print(model_handler.get_model_summary())
