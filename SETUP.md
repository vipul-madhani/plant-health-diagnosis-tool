# 🚀 Local Development Setup Guide

## Plant Health Diagnosis Tool - Complete Installation Instructions

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software:
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/)
- **phpMyAdmin** (Optional) - [Download](https://www.phpmyadmin.net/)
- **Git** - [Download](https://git-scm.com/downloads)

### For Mobile Development (Optional):
- **Expo CLI** - Install via npm: `npm install -g expo-cli`
- **Xcode** (for iOS, Mac only)
- **Android Studio** (for Android)

---

## 🗄️ Database Setup (MySQL)

### Step 1: Install MySQL

**On macOS:**
```bash
brew install mysql
brew services start mysql
```

**On Windows:**
1. Download MySQL Installer
2. Run installer and follow prompts
3. Set root password as: `gzkrits` (or your choice)

**On Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### Step 2: Secure MySQL Installation
```bash
sudo mysql_secure_installation
```

### Step 3: Create Database

```bash
# Login to MySQL
mysql -u root -p
# Enter password: gzkrits
```

```sql
-- Create database
CREATE DATABASE plant_health_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, for security)
CREATE USER 'plant_user'@'localhost' IDENTIFIED BY 'gzkrits';
GRANT ALL PRIVILEGES ON plant_health_db.* TO 'plant_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### Step 4: Initialize Database Schema

```bash
# Navigate to project directory
cd plant-health-diagnosis-tool

# Run initialization scripts
mysql -u root -p plant_health_db < db/init_database.sql
mysql -u root -p plant_health_db < db/schema.sql
mysql -u root -p plant_health_db < db/schema_knowledge_ecosystem.sql
mysql -u root -p plant_health_db < db/schema_phase5_extensions.sql
```

### Step 5: Install phpMyAdmin (Optional)

**On macOS (via Homebrew):**
```bash
brew install phpmyadmin
```

**Access phpMyAdmin:**
- URL: `http://localhost/phpmyadmin`
- Username: `root`
- Password: `gzkrits`

---

## 🐍 Backend Setup (Flask API)

### Step 1: Navigate to Backend Directory
```bash
cd backend-api
```

### Step 2: Create Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Create Environment File
```bash
# Copy example env file
cp ../.env.example .env

# Edit .env file with your configuration
nano .env  # or use any text editor
```

**Update these values in `.env`:**
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=gzkrits
DB_NAME=plant_health_db

JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
SECRET_KEY=your-flask-secret-key

SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Step 5: Test Database Connection
```bash
python db/mysql_connection.py
```

You should see: ✅ MySQL connection successful!

### Step 6: Run Backend Server
```bash
python app.py
```

Backend API will be running at: **http://localhost:5000**

Test it: `curl http://localhost:5000/api/health`

---

## 🌐 Frontend Web Setup (React)

### Step 1: Navigate to Frontend Web Directory
```bash
cd ../frontend-web
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Create Environment File
```bash
cp .env.example .env
```

**Edit `.env`:**
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 4: Start Development Server
```bash
npm start
# or
yarn start
```

Web app will open at: **http://localhost:3000**

---

## 📱 Mobile App Setup (React Native + Expo)

### Step 1: Navigate to Mobile Directory
```bash
cd ../frontend-mobile
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment File
```bash
echo "API_BASE_URL=http://localhost:5000/api" > .env
```

**Important:** For Android Emulator, use:
```bash
API_BASE_URL=http://10.0.2.2:5000/api
```

### Step 4: Start Expo Development Server
```bash
npm start
# or
expo start
```

### Step 5: Run on Device/Emulator

**For iOS (Mac only):**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

**For Physical Device:**
1. Install **Expo Go** app from App Store/Play Store
2. Scan QR code from terminal

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend-api
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

### Frontend Web Tests (if configured)
```bash
cd frontend-web
npm test
```

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error: Access denied for user 'root'@'localhost'**
```bash
# Reset MySQL root password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'gzkrits';
FLUSH PRIVILEGES;
EXIT;
```

**Error: Can't connect to MySQL server**
```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list           # macOS

# Start MySQL if not running
sudo systemctl start mysql   # Linux
brew services start mysql    # macOS
```

### Python Virtual Environment Issues

**Command not found: python3**
```bash
# Use python instead
python -m venv venv
```

### Port Already in Use

**Error: Port 5000 already in use**
```bash
# Kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000        # Windows (find PID, then kill)
```

### npm Install Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Verify Setup

### Check Backend
1. Open: http://localhost:5000/api/health
2. Should return: `{"status": "healthy", "database": "connected"}`

### Check Frontend Web
1. Open: http://localhost:3000
2. Should see login page

### Check Database
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Select `plant_health_db`
3. Verify tables exist: `users`, `consultations`, `blogs`, etc.

---

## 🎯 Next Steps

1. **Create Admin User** (via database or registration endpoint)
2. **Test User Registration** (farmer and agronomist)
3. **Upload Test Images** for plant diagnosis
4. **Configure Email SMTP** for notifications
5. **Train ML Model** with actual crop disease dataset

---

## 📚 Additional Resources

- **API Documentation:** See `docs/API_DOCUMENTATION.md`
- **Database Schema:** See `docs/DATABASE_SCHEMA.md`
- **ML Training Guide:** See `ml-model/TRAINING_GUIDE.md`
- **Deployment Guide:** See `docs/DEPLOYMENT.md` (coming soon)

---

## 🆘 Getting Help

If you encounter any issues:

1. Check the logs:
   - Backend: `backend-api/logs/app.log`
   - MySQL: `/var/log/mysql/error.log`

2. Enable debug mode:
   - Set `FLASK_DEBUG=True` in `.env`
   - Restart backend server

3. Verify all environment variables are set correctly

4. Ensure all prerequisites are installed and running

---

**Setup Complete! 🎉**

You're now ready to start developing the Plant Health Diagnosis Tool!
