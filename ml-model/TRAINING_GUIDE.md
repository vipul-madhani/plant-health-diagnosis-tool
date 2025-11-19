# ML Model Training Guide

## Plant Health Diagnosis Tool - Model Training Documentation

This guide walks you through training the plant health diagnosis ML model on your local machine. The model uses ResNet50 architecture for dual-output predictions: disease diagnosis and plant species identification.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Data Preparation](#data-preparation)
4. [Training](#training)
5. [Evaluation](#evaluation)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **macOS** (10.14+) or Linux/Windows
- **Python** 3.8 or higher
- **Storage**: ~5GB free space (for datasets + models)
- **RAM**: 8GB minimum (16GB recommended)
- **GPU**: Optional (NVIDIA GPU with CUDA support for faster training)

### macOS-Specific Notes
If you haven't installed Python 3.8+ on macOS yet:
```bash
# Install using Homebrew
brew install python@3.11

# Verify installation
python3 --version

# Set as default (optional)
echo 'export PATH="/usr/local/opt/python@3.11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/vipul-madhani/plant-health-diagnosis-tool.git
cd plant-health-diagnosis-tool
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

### 3. Install Dependencies
```bash
# Install main project dependencies
pip install -r requirements.txt

# Install ML-specific dependencies
pip install -r ml-model/ml-requirements.txt
```

**For GPU Support (Optional):**
```bash
# Install GPU-enabled TensorFlow
pip install tensorflow-gpu>=2.12.0
```

### 4. Verify Installation
```bash
python3 -c "import tensorflow as tf; print(f'TensorFlow: {tf.__version__}')"
python3 -c "import torch; print(f'PyTorch available')"
```

---

## Data Preparation

### Directory Structure
Create the following directory structure in your project root:

```
data/
├── disease_images/
│   ├── early_blight/
│   │   ├── tomato/
│   │   │   ├── image_001.jpg
│   │   │   ├── image_002.jpg
│   │   │   └── ...
│   │   └── potato/
│   │       └── ...
│   ├── late_blight/
│   │   └── ...
│   ├── powdery_mildew/
│   │   └── ...
│   └── ... (other diseases)
└── README.md
```

### Dataset Sources
See `docs/DATASETS.md` for recommended datasets:
- **PlantVillage Dataset** (free, ~54,000 images)
- **Custom datasets** (from research institutions)
- **Kaggle competitions** (Plant Disease Detection challenges)

### Data Guidelines
- **Image Format**: JPG, PNG (224x224 optimal, will auto-resize)
- **Dataset Split**: 70% train, 15% validation, 15% test (automatic)
- **Classes**: 12 disease types × 50+ plant species
- **Minimum**: 50 images per class (recommended 200+)

---

## Training

### Quick Start Training
```python
from ml_model.train import TrainingPipeline
from ml_model.data_loader import DataLoader

# Initialize pipeline
pipeline = TrainingPipeline(
    dataset_path="./data",
    output_dir="./trained_models",
    batch_size=32,
    epochs=50
)

# Setup components
pipeline.setup()

# Load data
loader = DataLoader("./data")
loader.prepare_data()

train_imgs, train_disease, train_species = loader.load_dataset(split="train")
val_imgs, val_disease, val_species = loader.load_dataset(split="val")

# Train model
history = pipeline.train(
    train_imgs, train_disease, train_species,
    val_imgs, val_disease, val_species
)

# Save model
model_path = pipeline.save_model("plant_health_model")
print(f"Model saved to: {model_path}")
```

### Training Script
Create `train_model.py`:
```bash
python3 ml-model/train.py
```

### Advanced Training Options

#### Fine-tuning (after initial training)
```python
# After initial training, fine-tune last 50 layers
pipeline.fine_tune(
    train_images, train_labels_disease, train_labels_species,
    num_layers=50,
    epochs=20
)
```

#### Hyperparameter Tuning
```python
pipeline = TrainingPipeline(
    dataset_path="./data",
    batch_size=16,      # Try: 16, 32, 64
    epochs=100,         # Try: 30-100
    validation_split=0.2
)
```

#### GPU Training
```bash
# Check GPU availability
python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"

# Enable memory growth to avoid OOM errors
GPU_MEMORY_FRACTION=0.8 python3 ml-model/train.py
```

---

## Evaluation

### Test Model Performance
```python
from ml_model.evaluate import ModelEvaluator

# Initialize evaluator
evaluator = ModelEvaluator(model_handler)

# Load test data
test_imgs, test_disease, test_species = loader.load_dataset(split="test")

# Evaluate
metrics = evaluator.evaluate(test_imgs, test_disease, test_species)

# Print summary
evaluator.print_evaluation_summary()

# Save results
evaluator.plot_confusion_matrix(
    test_disease, predictions,
    save_path="./trained_models/confusion_matrix.png"
)
```

### Expected Metrics
- **Accuracy**: 85-92% (depends on data quality)
- **F1-Score**: 0.80-0.90 for most diseases
- **Inference Time**: ~100ms per image on CPU

---

## Model Output Structure

### Trained Files
```
trained_models/
├── plant_health_model.h5          # Full model
├── plant_health_weights.weights.h5 # Weights only
├── model_checkpoint_YYYYMMDD_HHMMSS.h5
├── logs_YYYYMMDD_HHMMSS/          # TensorBoard logs
├── training_log.json              # Training metrics
└── confusion_matrix.png           # Evaluation plot
```

### Making Predictions
```python
import cv2
from ml_model.model import PlantHealthModel
from ml_model.evaluate import ModelEvaluator

# Load model
model_handler = PlantHealthModel()
model_handler.model = keras.models.load_model("./trained_models/plant_health_model.h5")

# Load and preprocess image
image = cv2.imread("plant_image.jpg")
image = cv2.resize(image, (224, 224))
image = image.astype('float32') / 255.0

# Get prediction
evaluator = ModelEvaluator(model_handler)
disease_idx, species_idx, disease_conf, species_conf = evaluator.get_prediction(image)

print(f"Disease: {disease_idx} ({disease_conf:.2%})")
print(f"Species: {species_idx} ({species_conf:.2%})")
```

---

## Troubleshooting

### Common Issues

#### 1. "No module named tensorflow"
```bash
pip install --upgrade tensorflow
# If still failing, reinstall everything
pip uninstall -y tensorflow keras
pip install tensorflow>=2.12.0
```

#### 2. Out of Memory (OOM) Errors
```python
# Reduce batch size
pipeline = TrainingPipeline(batch_size=8)  # Instead of 32

# On macOS, clear memory
import gc; gc.collect()
```

#### 3. Dataset Not Found
- Verify path: `ls -la ./data/disease_images/`
- Ensure directory structure matches requirements
- Check file permissions: `chmod -R 755 ./data/`

#### 4. Slow Training on macOS
- TensorFlow on macOS CPU is slower than GPU
- Consider using Metal acceleration (built-in on newer Macs)
- Training time: ~4-8 hours on CPU, ~30-60 min with GPU

#### 5. Python Virtual Environment Issues
```bash
# Deactivate and recreate
deactivate
rm -rf venv/
python3 -m venv venv
source venv/bin/activate
pip install -r ml-model/ml-requirements.txt
```

---

## Next Steps

After training:
1. **Deploy**: Convert model to TensorFlow Lite for mobile
2. **API Integration**: Connect to backend API (`backend-api/app.py`)
3. **Frontend**: Integrate with React frontend (`frontend-web/`)
4. **Docker**: Containerize for production deployment

---

## Performance Tips

- **Use GPU**: 10-15x faster training
- **Increase batch size**: Better hardware utilization (if no OOM)
- **Reduce image size**: 128x128 is 4x faster than 224x224
- **Data augmentation**: Improves generalization, slight slowdown
- **Early stopping**: Saves training time, prevents overfitting

---

## Support & Resources

- **TensorFlow Docs**: https://www.tensorflow.org/api_docs
- **ResNet Paper**: https://arxiv.org/abs/1512.03385
- **Dataset Info**: See `docs/DATASETS.md`
- **API Integration**: See `backend-api/app.py`

---

**Last Updated**: November 2025
**Model Version**: v1.0 (ResNet50)
**Python Required**: 3.8+
