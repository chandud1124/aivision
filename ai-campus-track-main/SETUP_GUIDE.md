# AI Campus Track - Complete Setup Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [AI Service Setup](#ai-service-setup)
6. [Database Configuration](#database-configuration)
7. [Running the Application](#running-the-application)
8. [Hardware Setup](#hardware-setup)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ / macOS 11+ / Windows 10+ (with WSL2)
- **CPU**: 4 cores (Intel i5 / AMD Ryzen 5 or better)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 50GB free space
- **GPU**: Optional but recommended (NVIDIA with CUDA support)
- **Network**: Stable internet connection for initial setup

### Software Requirements
- **Node.js**: v20.0.0 or higher
- **Python**: v3.10 or higher
- **MongoDB**: v6.0 or higher
- **Redis**: v7.0 or higher (optional, for caching)
- **Git**: Latest version

---

## 📦 Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/ai-campus-track.git
cd ai-campus-track
```

### 2. Install System Dependencies

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip
sudo apt install python3.10 python3-pip python3-venv

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Redis (optional)
sudo apt install redis-server
sudo systemctl start redis-server
```

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install Python
brew install python@3.10

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0

# Install Redis (optional)
brew install redis
brew services start redis
```

---

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/campus-track

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=7d

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=your-ai-service-api-key

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@campustrack.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### 4. Create Uploads Directory
```bash
mkdir -p uploads/{photos,temp}
mkdir -p logs
```

### 5. Initialize Database with Seed Data
```bash
npm run seed
```

This will create:
- Default Super Admin account
- Sample departments
- Sample students with RFID cards
- Test camera and RFID device configurations

### 6. Start Backend Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend should now be running at `http://localhost:5000`

---

## 🎨 Frontend Setup

### 1. Navigate to Root Directory
```bash
cd ..  # From backend directory
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_APP_NAME=AI Campus Track
```

### 4. Start Frontend Development Server
```bash
npm run dev
```

Frontend should now be running at `http://localhost:5173`

---

## 🤖 AI Service Setup

### 1. Navigate to AI Service Directory
```bash
mkdir -p ai-service
cd ai-service
```

### 2. Create Python Virtual Environment
```bash
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 3. Create Requirements File
```bash
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
opencv-python==4.8.1.78
numpy==1.24.3
pillow==10.1.0
ultralytics==8.0.206
deepface==0.0.79
mediapipe==0.10.8
tensorflow==2.15.0
torch==2.1.0
torchvision==0.16.0
scikit-learn==1.3.2
python-dotenv==1.0.0
pydantic==2.5.0
aiofiles==23.2.1
EOF
```

### 4. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 5. Download Pre-trained Models
```bash
mkdir -p models
cd models

# Download YOLOv8 Face Detection Model
wget https://github.com/derronqi/yolov8-face/releases/download/v1.0/yolov8n-face.pt

# Models for DeepFace are downloaded automatically on first use
cd ..
```

### 6. Create AI Service Configuration
```bash
cat > .env << EOF
PORT=8000
MODEL_PATH=./models
FACE_DETECTION_MODEL=yolov8n-face.pt
FACE_RECOGNITION_MODEL=VGGFace
CONFIDENCE_THRESHOLD=0.85
GPU_ENABLED=true
API_KEY=your-ai-service-api-key-same-as-backend
EOF
```

### 7. Create Main AI Service Application
```bash
cat > app.py << 'EOF'
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Campus Track - AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "name": "AI Campus Track - AI Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/ai/model-status")
def model_status():
    return {
        "success": True,
        "status": "ready",
        "models": {
            "face_detection": "YOLOv8",
            "face_recognition": "VGGFace",
            "anti_spoof": "MediaPipe"
        }
    }

@app.post("/api/ai/detect-face")
async def detect_face(data: dict):
    # TODO: Implement face detection
    return {
        "success": True,
        "faces_detected": 1,
        "confidence": 0.95
    }

@app.post("/api/ai/verify-face")
async def verify_face(data: dict):
    # TODO: Implement face verification
    return {
        "success": True,
        "match": True,
        "confidence": 0.92,
        "spoofDetected": False,
        "antiSpoof": {
            "isLive": True,
            "confidence": 0.98,
            "method": "MediaPipe"
        }
    }

@app.post("/api/ai/enroll-face")
async def enroll_face(data: dict):
    # TODO: Implement face enrollment
    return {
        "success": True,
        "embedding": [],
        "message": "Face enrolled successfully"
    }

@app.post("/api/ai/anti-spoof")
async def anti_spoof(data: dict):
    # TODO: Implement anti-spoofing
    return {
        "success": True,
        "isLive": True,
        "confidence": 0.97
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
EOF
```

### 8. Start AI Service
```bash
python app.py
```

AI Service should now be running at `http://localhost:8000`

---

## 💾 Database Configuration

### 1. Connect to MongoDB
```bash
mongosh
```

### 2. Create Database and User
```javascript
use campus-track

db.createUser({
  user: "campustrack_admin",
  pwd: "secure_password_here",
  roles: [
    { role: "readWrite", db: "campus-track" }
  ]
})
```

### 3. Verify Connection
```bash
mongosh mongodb://campustrack_admin:secure_password_here@localhost:27017/campus-track
```

---

## 🚀 Running the Application

### Development Mode (All Services)

#### Terminal 1: Backend
```bash
cd backend
npm run dev
```

#### Terminal 2: Frontend
```bash
npm run dev
```

#### Terminal 3: AI Service
```bash
cd ai-service
source venv/bin/activate
python app.py
```

### Production Mode (Using Docker)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Hardware Setup

### RFID Reader Setup (ESP32)

1. Flash ESP32 with RFID firmware
2. Configure WiFi credentials
3. Set backend API endpoint
4. Test connection

### Camera Setup

1. Configure IP camera or USB camera
2. Set RTSP stream URL
3. Test stream connectivity
4. Link to classroom and RFID reader

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### API Testing
```bash
# Using curl
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"Admin@123456"}'
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check logs
tail -f /var/log/mongodb/mongod.log
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### AI Service Not Starting
```bash
# Check Python version
python3 --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"
```

### Frontend Not Loading
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## 📝 Default Credentials

**Super Admin**
- Email: `admin@campus.edu`
- Password: `Admin@123456`

**HOD (Computer Science)**
- Email: `hod.cs@campus.edu`
- Password: `Hod@123456`

**Teacher**
- Email: `teacher@campus.edu`
- Password: `Teacher@123456`

**Student**
- Roll: `STU001`
- Password: `Student@123`

⚠️ **IMPORTANT**: Change all default passwords immediately after first login!

---

## 📚 Next Steps

1. ✅ Change default passwords
2. ✅ Configure email settings
3. ✅ Set up departments and classes
4. ✅ Register RFID devices
5. ✅ Configure cameras
6. ✅ Enroll student faces
7. ✅ Assign RFID cards to students
8. ✅ Test attendance flow
9. ✅ Configure alerts and notifications
10. ✅ Set up automated backups

---

## 🔗 Useful Commands

```bash
# Backend
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests
npm run seed         # Seed database

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# AI Service
python app.py        # Start AI service
pytest               # Run tests

# Database
mongosh              # Connect to MongoDB
mongodump            # Backup database
mongorestore         # Restore database
```

---

## 📞 Support

For issues and questions:
- **Email**: support@aicampustrack.com
- **Documentation**: https://docs.aicampustrack.com
- **GitHub Issues**: https://github.com/your-org/ai-campus-track/issues

---

**Built with ❤️ for Educational Institutions**
