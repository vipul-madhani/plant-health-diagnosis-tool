# Quick Start Guide - Plant Health Diagnosis Tool

## Overview
This guide will walk you through setting up the Plant Health Diagnosis Tool on your macOS system. We'll cover cloning the repository, setting up the Python environment, installing dependencies, and running the backend API.

## Prerequisites

Before you begin, ensure you have the following installed on your macOS:

### 1. Xcode Command Line Tools
```bash
xcode-select --install
```

### 2. Homebrew (Package Manager)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 3. Python 3.8+
We recommend using Homebrew to install Python:
```bash
brew install python@3.11
```

Verify installation:
```bash
python3 --version
```

### 4. Git
```bash
brew install git
```

## Step 1: Clone the Repository

Open Terminal and clone the repository to your desired location:

```bash
git clone https://github.com/vipul-madhani/plant-health-diagnosis-tool.git
cd plant-health-diagnosis-tool
```

## Step 2: Set Up Python Virtual Environment

Creating a virtual environment isolates your project dependencies and prevents conflicts with other Python projects.

### Create Virtual Environment
```bash
python3 -m venv venv
```

### Activate Virtual Environment
```bash
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal prompt, indicating the virtual environment is active.

## Step 3: Install Python Dependencies

With the virtual environment activated, install all required packages:

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

This will install all dependencies including:
- Flask (REST API framework)
- TensorFlow (Deep learning)
- OpenCV (Image processing)
- Pillow (Image manipulation)
- Firebase Admin (Cloud backend)
- And more...

## Step 4: Download Training Datasets

For model training and testing, download the PlantVillage dataset:

1. **Kaggle Dataset**: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
   - Register for a free Kaggle account
   - Download the PlantVillage dataset (~2GB)
   - Extract to: `ml-model/data/plantvillage/`

2. **Alternative Links** (See `docs/DATASETS.md` for more options):
   - New Plant Diseases Dataset
   - PlantDoc Dataset
   - PlantSeg Dataset

## Step 5: Run the Backend API

Navigate to the backend directory and start the Flask development server:

```bash
cd backend-api
python app.py
```

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

## Step 6: Test the API

Open a new Terminal tab and test the API endpoints:

### Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Plant Health Diagnosis API",
  "version": "1.0.0"
}
```

### Get Plant Species
```bash
curl http://localhost:5000/api/species
```

### Diagnose Plant Health (with image upload)
```bash
curl -F "image=@/path/to/plant_image.jpg" \
  http://localhost:5000/api/diagnose
```

## Troubleshooting

### Issue: Python not found or wrong version
**Solution**: Verify you're using Python 3.8+
```bash
python3 --version
```

### Issue: Virtual environment not activating
**Solution**: Use the full path to activate
```bash
source /full/path/to/plant-health-diagnosis-tool/venv/bin/activate
```

### Issue: pip install fails with permission error
**Solution**: Ensure virtual environment is activated and try upgrading pip:
```bash
pip install --upgrade pip
```

### Issue: TensorFlow installation takes too long
**Solution**: This is normal for the first installation. TensorFlow is large (~500MB). Use a stable internet connection.

### Issue: OpenCV import errors
**Solution**: On macOS, you may need to install additional dependencies:
```bash
brew install opencv
```

### Issue: Port 5000 already in use
**Solution**: Change the port in `backend-api/app.py` or kill the process using port 5000:
```bash
lsof -ti:5000 | xargs kill -9
```

## Environment Configuration

Create a `.env` file in the project root for sensitive configuration:

```bash
cp .env.example .env
```

Edit `.env` and add your configurations:
```
FLASK_ENV=development
FLASK_DEBUG=True
API_PORT=5000
FIREBASE_API_KEY=your_firebase_key_here
```

## Next Steps

1. **Backend Development**: Explore `backend-api/app.py` and add more diagnosis endpoints
2. **ML Model Training**: Check `ml-model/` for training scripts using PlantVillage dataset
3. **Frontend Setup**: Follow frontend-specific guides in `docs/` for React web and React Native mobile
4. **Firebase Setup**: Configure Firebase for authentication and database
5. **Dataset Exploration**: Review `docs/DATASETS.md` for additional plant disease datasets

## Project Structure Reference

```
plant-health-diagnosis-tool/
├── backend-api/           # Python Flask REST API
│   ├── app.py            # Main API application
│   └── requirements.txt   # Python dependencies
├── frontend-web/         # ReactJS web application
├── frontend-mobile/      # React Native mobile app
├── ml-model/            # ML model training & inference
├── firebase/            # Firebase configuration
├── docs/                # Documentation
│   ├── QUICKSTART.md    # This file
│   ├── DATASETS.md      # Dataset links and info
│   └── ARCHITECTURE.md  # System architecture
└── venv/                # Python virtual environment (created locally)
```

## Additional Resources

- **Flask Documentation**: https://flask.palletsprojects.com/
- **TensorFlow Tutorials**: https://www.tensorflow.org/tutorials
- **Plant Disease Research**: See `docs/DATASETS.md`
- **Kaggle Datasets**: https://www.kaggle.com/datasets
- **macOS Python Setup Guide**: https://docs.python-guide.org/starting/install3/osx/

## Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review error messages carefully
3. Consult the project README.md for more context
4. Check GitHub Issues: https://github.com/vipul-madhani/plant-health-diagnosis-tool/issues

## Next Set of Tasks

After successfully setting up and running the backend:
1. Create ARCHITECTURE.md for detailed system design
2. Set up frontend-web with React boilerplate
3. Initialize ML model training pipeline
4. Configure Firebase integration
5. Create CI/CD workflows

Happy coding! 🌱
