import os
import numpy as np
from pathlib import Path
from typing import Tuple, List, Dict
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from PIL import Image
import cv2


class DataLoader:
    """
    Data loading and preprocessing for plant health diagnosis.
    
    Handles:
    - Dataset organization (train/val/test splits)
    - Image loading and resizing
    - Data augmentation
    - Label encoding
    - Batch processing
    """
    
    def __init__(
        self,
        dataset_path: str,
        image_size: Tuple[int, int] = (224, 224),
        train_split: float = 0.7,
        val_split: float = 0.15,
        test_split: float = 0.15
    ):
        """
        Initialize the data loader.
        
        Args:
            dataset_path: Root path to dataset directory
            image_size: Size to resize images to (height, width)
            train_split: Fraction for training data
            val_split: Fraction for validation data
            test_split: Fraction for test data
        """
        self.dataset_path = Path(dataset_path)
        self.image_size = image_size
        self.train_split = train_split
        self.val_split = val_split
        self.test_split = test_split
        
        # Validate splits
        total = train_split + val_split + test_split
        if not abs(total - 1.0) < 0.01:
            raise ValueError(f"Splits must sum to 1.0, got {total}")
        
        self.disease_classes = []
        self.species_classes = []
        self.class_to_idx = {}
        self.idx_to_class = {}
        
    def prepare_data(self):
        """
        Prepare and organize the dataset.
        
        Expected structure:
        dataset_path/
          disease_images/
            disease_class_1/
              species_1/
                image1.jpg
                image2.jpg
              species_2/
                ...
            disease_class_2/
              ...
        """
        print("[DATA] Preparing dataset...")
        
        disease_path = self.dataset_path / "disease_images"
        
        if not disease_path.exists():
            print(f"[WARNING] Dataset path {disease_path} does not exist")
            print("[INFO] Create this structure:")
            print("  disease_images/")
            print("    disease_name_1/")
            print("      species_1/")
            print("        image1.jpg")
            print("      species_2/")
            print("        image2.jpg")
            return
        
        # Discover disease classes
        disease_dirs = [d for d in disease_path.iterdir() if d.is_dir()]
        self.disease_classes = sorted([d.name for d in disease_dirs])
        
        print(f"[DATA] Found {len(self.disease_classes)} disease classes:")
        for i, disease in enumerate(self.disease_classes):
            print(f"  {i}: {disease}")
        
        # Discover species classes
        species_set = set()
        for disease_dir in disease_dirs:
            species_dirs = [d for d in disease_dir.iterdir() if d.is_dir()]
            for species_dir in species_dirs:
                species_set.add(species_dir.name)
        
        self.species_classes = sorted(list(species_set))
        print(f"[DATA] Found {len(self.species_classes)} species classes:")
        for i, species in enumerate(self.species_classes):
            print(f"  {i}: {species}")
        
        # Create mapping dictionaries
        self.disease_to_idx = {d: i for i, d in enumerate(self.disease_classes)}
        self.idx_to_disease = {i: d for d, i in self.disease_to_idx.items()}
        
        self.species_to_idx = {s: i for i, s in enumerate(self.species_classes)}
        self.idx_to_species = {i: s for s, i in self.species_to_idx.items()}
        
        print("[DATA] Dataset preparation complete!")
    
    def load_image(self, image_path: str, resize: bool = True) -> np.ndarray:
        """
        Load and preprocess a single image.
        
        Args:
            image_path: Path to the image file
            resize: Whether to resize to model input size
            
        Returns:
            Image as numpy array
        """
        try:
            image = cv2.imread(str(image_path))
            if image is None:
                # Try with PIL as fallback
                image = np.array(Image.open(image_path))
                if len(image.shape) == 2:  # Grayscale
                    image = np.stack([image] * 3, axis=-1)
            else:
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            if resize:
                image = cv2.resize(image, self.image_size)
            
            # Normalize to [0, 1]
            image = image.astype(np.float32) / 255.0
            
            return image
        except Exception as e:
            print(f"[ERROR] Failed to load {image_path}: {e}")
            return None
    
    def load_dataset(
        self,
        split: str = "train",
        augment: bool = False
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Load a dataset split.
        
        Args:
            split: One of 'train', 'val', 'test'
            augment: Whether to apply data augmentation
            
        Returns:
            Tuple of (images, disease_labels, species_labels)
        """
        if not self.disease_classes:
            print("[ERROR] Call prepare_data() first")
            return None, None, None
        
        print(f"[DATA] Loading {split} dataset...")
        
        images = []
        disease_labels = []
        species_labels = []
        
        disease_path = self.dataset_path / "disease_images"
        
        for disease_dir in disease_path.iterdir():
            if not disease_dir.is_dir():
                continue
            
            disease_idx = self.disease_to_idx[disease_dir.name]
            
            for species_dir in disease_dir.iterdir():
                if not species_dir.is_dir():
                    continue
                
                species_idx = self.species_to_idx[species_dir.name]
                
                # Get all images in species directory
                image_files = list(species_dir.glob("*.jpg")) + \
                             list(species_dir.glob("*.png")) + \
                             list(species_dir.glob("*.jpeg"))
                
                print(f"[DATA] Found {len(image_files)} images for "
                      f"{disease_dir.name}/{species_dir.name}")
                
                for img_file in image_files:
                    image = self.load_image(str(img_file))
                    if image is not None:
                        images.append(image)
                        disease_labels.append(disease_idx)
                        species_labels.append(species_idx)
        
        images = np.array(images)
        disease_labels = np.array(disease_labels)
        species_labels = np.array(species_labels)
        
        # Convert labels to one-hot encoding
        disease_labels = tf.keras.utils.to_categorical(
            disease_labels,
            num_classes=len(self.disease_classes)
        )
        species_labels = tf.keras.utils.to_categorical(
            species_labels,
            num_classes=len(self.species_classes)
        )
        
        print(f"[DATA] Loaded {len(images)} images for {split}")
        print(f"[DATA] Shape: {images.shape}")
        
        return images, disease_labels, species_labels
    
    def get_augmentation_generator(self) -> ImageDataGenerator:
        """
        Create an image data augmentation generator.
        
        Returns:
            ImageDataGenerator configured for training
        """
        return ImageDataGenerator(
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            vertical_flip=False,
            fill_mode='nearest'
        )
    
    def get_dataset_info(self) -> Dict:
        """
        Get information about the loaded dataset.
        
        Returns:
            Dictionary with dataset statistics
        """
        return {
            'disease_classes': self.disease_classes,
            'species_classes': self.species_classes,
            'num_diseases': len(self.disease_classes),
            'num_species': len(self.species_classes),
            'image_size': self.image_size,
            'train_split': self.train_split,
            'val_split': self.val_split,
            'test_split': self.test_split
        }


if __name__ == "__main__":
    # Example usage
    loader = DataLoader(dataset_path="./data")
    loader.prepare_data()
    
    info = loader.get_dataset_info()
    print("\nDataset Info:")
    for key, value in info.items():
        print(f"  {key}: {value}")
