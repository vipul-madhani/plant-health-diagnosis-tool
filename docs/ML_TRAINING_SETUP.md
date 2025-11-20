# 🤖 MACHINE LEARNING MODEL TRAINING SETUP

**Plant Health Diagnosis Tool - ML Training Guide for macOS**

---

## 💻 PREREQUISITES

### macOS System Requirements

- **macOS**: 10.15 (Catalina) or later
- **Python**: 3.8+ (pre-installed on macOS 11+)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space for datasets and models
- **Xcode Command Line Tools**: Required for some dependencies

### Check Python Version

```bash
python3 --version
# Should show Python 3.8.x or higher
```

---

## 🛠️ ENVIRONMENT SETUP

### Step 1: Install Xcode Command Line Tools

```bash
xcode-select --install
```

### Step 2: Create Python Virtual Environment

```bash
# Navigate to project directory
cd plant-health-diagnosis-tool

# Create virtual environment
python3 -m venv ml_env

# Activate virtual environment
source ml_env/bin/activate

# Verify activation (you should see (ml_env) in your terminal prompt)
which python
# Should show: /path/to/plant-health-diagnosis-tool/ml_env/bin/python
```

### Step 3: Upgrade pip

```bash
pip install --upgrade pip setuptools wheel
```

### Step 4: Install TensorFlow for macOS

#### For Apple Silicon (M1/M2/M3 Macs)

```bash
# Install TensorFlow for Apple Silicon
pip install tensorflow-macos==2.12.0
pip install tensorflow-metal==0.8.0  # GPU acceleration
```

#### For Intel Macs

```bash
# Install standard TensorFlow
pip install tensorflow==2.12.0
```

### Step 5: Install Required Dependencies

```bash
pip install numpy==1.24.3
pip install pandas==2.0.3
pip install pillow==10.0.0
pip install matplotlib==3.7.2
pip install scikit-learn==1.3.0
pip install opencv-python==4.8.0.74
```

### Verify Installation

```bash
python -c "import tensorflow as tf; print(tf.__version__); print('GPU Available:', tf.config.list_physical_devices('GPU'))"
```

---

## 📊 DATASET PREPARATION

### Dataset Structure

Create the following directory structure:

```
ml_training/
├── dataset/
│   ├── train/
│   │   ├── healthy/
│   │   │   ├── image1.jpg
│   │   │   ├── image2.jpg
│   │   │   └── ...
│   │   ├── leaf_blight/
│   │   │   ├── image1.jpg
│   │   │   └── ...
│   │   ├── powdery_mildew/
│   │   │   └── ...
│   │   └── rust/
│   │       └── ...
│   ├── validation/
│   │   ├── healthy/
│   │   ├── leaf_blight/
│   │   ├── powdery_mildew/
│   │   └── rust/
│   └── test/
│       ├── healthy/
│       ├── leaf_blight/
│       ├── powdery_mildew/
│       └── rust/
├── models/
└── train_model.py
```

### Download Dataset

Refer to the `DATASETS.md` documentation for download links to plant disease datasets:

```bash
# Create directory structure
mkdir -p ml_training/dataset/{train,validation,test}/{healthy,leaf_blight,powdery_mildew,rust}

# Download and organize datasets according to DATASETS.md instructions
```

---

## 🎓 TRAINING SCRIPT

### Complete `train_model.py`

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import os
from datetime import datetime

# Configuration
CONFIG = {
    'img_height': 224,
    'img_width': 224,
    'batch_size': 32,
    'epochs': 50,
    'learning_rate': 0.0001,
    'dataset_dir': 'dataset',
    'model_save_dir': 'models'
}

# Disease classes
CLASS_NAMES = ['healthy', 'leaf_blight', 'powdery_mildew', 'rust']

def create_data_generators():
    """Create data generators with augmentation"""
    
    # Training data with augmentation
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    # Validation data (no augmentation)
    val_datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255
    )
    
    # Load datasets
    train_generator = train_datagen.flow_from_directory(
        os.path.join(CONFIG['dataset_dir'], 'train'),
        target_size=(CONFIG['img_height'], CONFIG['img_width']),
        batch_size=CONFIG['batch_size'],
        class_mode='categorical',
        shuffle=True
    )
    
    val_generator = val_datagen.flow_from_directory(
        os.path.join(CONFIG['dataset_dir'], 'validation'),
        target_size=(CONFIG['img_height'], CONFIG['img_width']),
        batch_size=CONFIG['batch_size'],
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, val_generator

def build_model():
    """Build CNN model using transfer learning (MobileNetV2)"""
    
    # Load pre-trained MobileNetV2
    base_model = keras.applications.MobileNetV2(
        input_shape=(CONFIG['img_height'], CONFIG['img_width'], 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base model
    base_model.trainable = False
    
    # Build model
    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.2),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(len(CLASS_NAMES), activation='softmax')
    ])
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate']),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.AUC(name='auc')]
    )
    
    return model

def train():
    """Main training function"""
    
    print("\u2728 Starting Plant Health Model Training...")
    print(f"TensorFlow Version: {tf.__version__}")
    print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")
    
    # Create data generators
    print("\n📊 Loading datasets...")
    train_gen, val_gen = create_data_generators()
    
    print(f"Training samples: {train_gen.samples}")
    print(f"Validation samples: {val_gen.samples}")
    print(f"Class distribution: {train_gen.class_indices}")
    
    # Build model
    print("\n🏭 Building model...")
    model = build_model()
    model.summary()
    
    # Callbacks
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            filepath=os.path.join(CONFIG['model_save_dir'], f'best_model_{timestamp}.h5'),
            save_best_only=True,
            monitor='val_accuracy',
            mode='max',
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,
            patience=5,
            min_lr=0.00001,
            verbose=1
        ),
        keras.callbacks.TensorBoard(
            log_dir=os.path.join('logs', timestamp)
        )
    ]
    
    # Train model
    print("\n🚀 Training started...")
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=CONFIG['epochs'],
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model
    final_model_path = os.path.join(CONFIG['model_save_dir'], f'plant_health_model_{timestamp}.h5')
    model.save(final_model_path)
    print(f"\n✅ Final model saved: {final_model_path}")
    
    return model, history

if __name__ == '__main__':
    # Create directories
    os.makedirs(CONFIG['model_save_dir'], exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    # Train model
    model, history = train()
    
    print("\n✨ Training completed successfully!")
```

---

## 🏃 RUNNING TRAINING

### Execute Training

```bash
# Activate virtual environment
source ml_env/bin/activate

# Navigate to ml_training directory
cd ml_training

# Run training
python train_model.py
```

### Monitor Training with TensorBoard

In a separate terminal:

```bash
source ml_env/bin/activate
tensorboard --logdir logs/
# Open http://localhost:6006 in browser
```

---

## 📦 MODEL EXPORT

### Convert to TensorFlow Lite (for mobile)

```python
import tensorflow as tf

# Load trained model
model = tf.keras.models.load_model('models/plant_health_model_20251120_120000.h5')

# Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# Save
with open('models/plant_health_model.tflite', 'wb') as f:
    f.write(tflite_model)

print("Model converted to TFLite successfully!")
```

---

## 🔧 TROUBLESHOOTING

### Issue: ImportError for TensorFlow Metal

**Solution**:
```bash
# macOS only - install Metal plugin for GPU acceleration
pip uninstall tensorflow-metal
pip install tensorflow-metal==0.8.0
```

### Issue: Memory Error During Training

**Solution**:
- Reduce `batch_size` in CONFIG (try 16 or 8)
- Close other applications
- Ensure sufficient RAM available

```python
CONFIG['batch_size'] = 16  # Reduced from 32
```

### Issue: Low Accuracy

**Solutions**:
1. **More Data**: Ensure at least 500+ images per class
2. **Balanced Dataset**: Equal distribution across classes
3. **Data Quality**: Remove corrupted or mislabeled images
4. **Training Duration**: Increase epochs to 100
5. **Fine-tuning**: Unfreeze last few layers of base model

### Issue: Python Version Compatibility

```bash
# Check Python version
python3 --version

# If Python < 3.8, upgrade using Homebrew
brew install python@3.10
python3.10 -m venv ml_env
```

---

## ✅ VALIDATION

### Test Trained Model

```python
import tensorflow as tf
import numpy as np
from PIL import Image

# Load model
model = tf.keras.models.load_model('models/plant_health_model_20251120_120000.h5')

# Load and preprocess test image
img = Image.open('test_image.jpg')
img = img.resize((224, 224))
img_array = np.array(img) / 255.0
img_array = np.expand_dims(img_array, axis=0)

# Predict
predictions = model.predict(img_array)
class_names = ['healthy', 'leaf_blight', 'powdery_mildew', 'rust']

predicted_class = class_names[np.argmax(predictions[0])]
confidence = np.max(predictions[0]) * 100

print(f"Prediction: {predicted_class}")
print(f"Confidence: {confidence:.2f}%")
```

---

## 📈 EXPECTED RESULTS

- **Training Time**: 2-4 hours (Apple Silicon), 4-6 hours (Intel Mac)
- **Target Accuracy**: 85%+ on validation set
- **Model Size**: ~14MB (full model), ~4MB (TFLite)
- **Inference Time**: ~50ms per image (Apple Silicon GPU)

---

## 📝 NOTES FOR macOS USERS

1. **Apple Silicon (M1/M2/M3)**:
   - Use `tensorflow-macos` and `tensorflow-metal`
   - GPU acceleration significantly speeds up training
   - May see "metal" warnings - these are safe to ignore

2. **Intel Macs**:
   - Use standard `tensorflow` package
   - CPU-only training (no GPU acceleration)
   - Consider using Google Colab for faster training

3. **Virtual Environment**:
   - Always activate before training
   - Keeps dependencies isolated
   - Prevents conflicts with system Python

---

**Generated**: November 20, 2025  
**Platform**: macOS (Catalina+)  
**Python**: 3.8+  
**TensorFlow**: 2.12.0
