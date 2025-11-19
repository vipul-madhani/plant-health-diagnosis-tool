# Local Development Setup - Plant Health Diagnosis Tool

## Prerequisites

- Python 3.8+ (macOS: use Homebrew or python.org installer)
- VS Code with Python extension
- SQLite 3 (usually pre-installed on macOS)
- Git

## Python Setup on macOS

### Option 1: Using Homebrew (Recommended)
```bash
brew install python@3.11
brew link python@3.11
python3 --version  # Should show 3.11+
```

### Option 2: Using Official Installer
1. Download from https://www.python.org/downloads/
2. Run the installer
3. Verify: `python3 --version`

---

## Backend Setup

### 1. Clone Repository
```bash
cd ~/projects  # or your preferred location
git clone https://github.com/vipul-madhani/plant-health-diagnosis-tool.git
cd plant-health-diagnosis-tool
```

### 2. Create Virtual Environment
```bash
# Navigate to backend
cd backend-api

# Create venv
python3 -m venv venv

# Activate venv
source venv/bin/activate  # macOS/Linux
# or on Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Initialize Database
```bash
# Execute schema files in order
sqlite3 database.db < db/schema_auth_sessions.sql
sqlite3 database.db < db/schema_chat_messages.sql
sqlite3 database.db < db/schema_consultations.sql
```

### 5. Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required .env variables:**
```env
FLASK_ENV=development
FLASK_DEBUG=True
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=7

# Email Configuration (Simple SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@plant-health.com

# Database
DATABASE_PATH=database.db
```

### 6. Run Backend
```bash
# From backend-api directory with venv activated
python app.py

# Server starts at http://localhost:5000
```

---

## Testing API Endpoints

### Using cURL

#### 1. Register Farmer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "secure_pass123",
    "name": "Raj Kumar",
    "role": "farmer",
    "state": "Punjab"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "secure_pass123"
  }'

# Response includes: access_token, refresh_token, user_id
```

#### 3. Submit Consultation
```bash
curl -X POST http://localhost:5000/api/consultation/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "plant_image": "image_url_or_base64",
    "description": "Yellow spots on leaves",
    "region": "Punjab",
    "season": "Monsoon"
  }'
```

#### 4. Get Consultations
```bash
curl -X GET "http://localhost:5000/api/consultation/user/list?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import collection: `docs/plant-health-api.postman_collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:5000
   - `access_token`: (from login response)
   - `consultation_id`: (from submit response)
3. Run requests in order

---

## Database Inspection

### View Tables
```bash
sqlite3 database.db ".tables"
```

### Query Data
```bash
sqlite3 database.db

# In sqlite prompt
sqlite> SELECT * FROM users LIMIT 10;
sqlite> SELECT * FROM consultations;
sqlite> SELECT * FROM chat_messages;
sqlite> .exit
```

### Reset Database
```bash
rm database.db
sqlite3 database.db < db/schema_auth_sessions.sql
sqlite3 database.db < db/schema_chat_messages.sql
sqlite3 database.db < db/schema_consultations.sql
```

---

## Troubleshooting

### Python Environment Issues

**Problem**: `python3: command not found`
```bash
# Solution 1: Use python instead of python3
python --version

# Solution 2: Add Python to PATH (macOS)
echo 'export PATH="/usr/local/opt/python@3.11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Problem**: `ModuleNotFoundError` when importing Flask
```bash
# Solution: Ensure venv is activated
source venv/bin/activate
pip list  # Should show Flask
```

### Database Issues

**Problem**: `database.db` file not found
```bash
# Solution: Create database with schema
sqlite3 database.db < db/schema_auth_sessions.sql
```

**Problem**: `table already exists` error
```bash
# Solution: Drop and recreate
rm database.db
sqlite3 database.db < db/schema_auth_sessions.sql
```

### JWT Token Issues

**Problem**: `401 Unauthorized` on protected endpoints
```bash
# Solution 1: Ensure JWT_SECRET_KEY in .env
# Solution 2: Check token format in Authorization header
# Should be: Authorization: Bearer <token>

# Solution 3: Token may be expired (7 hour expiry)
# Use refresh endpoint to get new token
```

---

## VS Code Configuration

### Launch Configuration (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Plant Health Backend",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend-api/app.py",
      "console": "integratedTerminal",
      "justMyCode": true,
      "cwd": "${workspaceFolder}/backend-api",
      "env": {
        "FLASK_ENV": "development",
        "FLASK_DEBUG": "True"
      }
    }
  ]
}
```

### Run in VS Code
1. Open Run menu (Ctrl+Shift+D)
2. Select "Plant Health Backend"
3. Click Run button
4. Backend starts with debugger attached

---

## Docker Option (Alternative)

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app/backend-api

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN sqlite3 database.db < db/schema_auth_sessions.sql && \
    sqlite3 database.db < db/schema_chat_messages.sql && \
    sqlite3 database.db < db/schema_consultations.sql

EXPOSE 5000

CMD ["python", "app.py"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend-api
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: development
      JWT_SECRET_KEY: dev-secret-key
    volumes:
      - ./backend-api:/app/backend-api
```

### Run with Docker
```bash
docker-compose up --build
```

---

## Performance Testing

### Load Testing with Apache Bench
```bash
# Install (macOS)
brew install httpd

# Test concurrent requests
ab -n 100 -c 10 http://localhost:5000/api/auth/register
```

### Real-time Chat Testing
```bash
# Terminal 1: Start backend
python app.py

# Terminal 2: Send message
curl -X POST http://localhost:5000/api/chat/send \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"consultation_id": "123", "message": "Test"}'
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Update JWT_SECRET_KEY to strong random value
- [ ] Set FLASK_ENV=production
- [ ] Configure proper SMTP credentials
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure CORS for frontend domains
- [ ] Enable rate limiting
- [ ] Set up logging to file
- [ ] Configure monitoring/alerts
- [ ] Test all endpoints with real data

---

## Next Steps

1. ✅ Backend API running
2. ⏳ Create mobile app (connects to this API)
3. ⏳ Create website (connects to this API)
4. ⏳ Deploy to cloud (AWS, Azure, or Heroku)

