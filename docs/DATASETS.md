# 📊 Plant Disease Datasets

Comprehensive list of datasets for training your plant disease detection model.

## 🎯 Primary Datasets (Recommended)

### 1. PlantVillage Dataset ⭐ **BEST FOR STARTING**
- **Size**: 54,303 images
- **Species**: 14 crop species
- **Classes**: 38 different diseases + healthy
- **Format**: RGB images (256x256)
- **Quality**: High-quality, labeled images
- **Download Links**:
  - **Kaggle**: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
  - **GitHub**: https://github.com/spMohanty/PlantVillage-Dataset
  - **TensorFlow Datasets**: `tfds.load('plant_village')`

**Species Included**: Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato

### 2. New Plant Diseases Dataset (87K Images)
- **Size**: 87,000+ images
- **Classes**: 38 categories
- **Link**: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
- **Split**: Pre-divided into train/val/test (80/10/10)

### 3. PlantDoc Dataset (In-the-Wild Images)
- **Size**: 2,598 images
- **Species**: 13 plant species
- **Classes**: 17 disease classes
- **Special**: Real-world conditions (not lab images)
- **Link**: https://github.com/pratikkayal/PlantDoc-Dataset

---

## 🔬 Specialized Datasets

### 4. Plant Pathology 2020 - FGVC7 (Kaggle Competition)
- **Focus**: Apple leaf diseases
- **Classes**: Healthy, Multiple Diseases, Rust, Scab
- **Link**: https://www.kaggle.com/competitions/plant-pathology-2020-fgvc7

### 5. PlantSeg (Segmentation Dataset)
- **Size**: 11,400+ images
- **Classes**: 115 different diseases
- **Special**: Includes segmentation masks
- **Link**: https://github.com/tqwei05/PlantSeg

### 6. Crop-Specific Datasets
- **Corn/Maize**: https://www.kaggle.com/datasets/smaranjitghose/corn-or-maize-leaf-disease-dataset
- **Tomato**: https://www.kaggle.com/datasets/mvgehlot/tomato-village-dataset
- **Cotton**: https://www.kaggle.com/datasets?search=cotton+plant+disease
- **Rice/Wheat**: Search Kaggle for specific crops

---

## 📥 How to Download

### Option 1: Kaggle API (Recommended)
```bash
# Install Kaggle CLI
pip install kaggle

# Download PlantVillage
kaggle datasets download -d abdallahalidev/plantvillage-dataset

# Unzip
unzip plantvillage-dataset.zip -d ml-model/data/
```

### Option 2: Git Clone (GitHub Datasets)
```bash
# PlantVillage
git clone https://github.com/spMohanty/PlantVillage-Dataset
cd PlantVillage-Dataset/raw/color/

# PlantDoc
git clone https://github.com/pratikkayal/PlantDoc-Dataset
```

### Option 3: TensorFlow Datasets
```python
import tensorflow_datasets as tfds

# Load PlantVillage directly
dataset, info = tfds.load('plant_village', with_info=True, as_supervised=True)
```

---

## 📂 Recommended Data Structure

After downloading, organize like this:
```
ml-model/
└── data/
    ├── raw/
    │   └── plantvillage/
    │       ├── color/
    │       └── segmented/
    ├── processed/
    │   ├── train/
    │   ├── val/
    │   └── test/
    └── models/
        └── trained_model.h5
```

---

## 🎓 Dataset Comparison

| Dataset | Size | Quality | Real-World | Best For |
|---------|------|---------|------------|----------|
| PlantVillage | 54K | ⭐⭐⭐⭐⭐ | ❌ Lab | Initial Training |
| New Plant Diseases | 87K | ⭐⭐⭐⭐ | ❌ Lab | Large-scale Training |
| PlantDoc | 2.6K | ⭐⭐⭐⭐ | ✅ Yes | Real-world Testing |
| PlantSeg | 11K | ⭐⭐⭐⭐ | ✅ Yes | Segmentation Tasks |

---

## 💡 Tips for Using Datasets

1. **Start Small**: Begin with PlantVillage (54K images) - it's well-labeled and easier to train on
2. **Augmentation**: Use data augmentation to increase variety (rotation, flip, brightness)
3. **Combine Datasets**: Mix lab + real-world images for better generalization
4. **Class Balance**: Check class distribution and use weighted loss if imbalanced
5. **Train/Val/Test Split**: Use 70/20/10 or 80/10/10 split

---

## 🚀 Next Steps

1. Download PlantVillage dataset (easiest to start)
2. Explore the data using the provided Colab notebook
3. Train a baseline model (MobileNet or EfficientNet)
4. Test on real-world images (PlantDoc)
5. Iterate and improve!

---

## 📌 Additional Resources

- **Papers with Code**: https://paperswithcode.com/task/plant-disease-detection
- **Roboflow Plant Datasets**: https://roboflow.com/datasets?q=plant
- **TensorFlow Plant Guide**: https://www.tensorflow.org/datasets/catalog/plant_village

---

**Last Updated**: November 2025
