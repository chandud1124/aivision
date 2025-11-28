# AI Campus Attendance Tracker - Complete Setup Guide

## Overview

This is a comprehensive AI-powered campus attendance tracking system with:
- **AI Face Recognition** using multiple detection algorithms (dlib, MTCNN, OpenCV)
- **RFID Integration** for card-based attendance
- **Real-time Camera Streaming** and monitoring
- **Role-Based Access Control** (Admin, Teacher, Student, Security)
- **Advanced Analytics** and reporting
- **Multi-platform support** (Web, Mobile-ready API)

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Setup](#database-setup)
5. [AI Model Configuration](#ai-model-configuration)
6. [RFID Hardware Setup](#rfid-hardware-setup)
7. [Camera Configuration](#camera-configuration)
8. [Running the Application](#running-the-application)
9. [API Documentation](#api-documentation)
10. [Testing](#testing)
11. [Deployment](#deployment)

## Prerequisites

### System Requirements
- **OS**: macOS, Linux, or Windows with WSL2
- **RAM**: Minimum 8GB (16GB recommended for AI models)
- **Disk Space**: 10GB free space
- **Python**: 3.9 or higher
- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (optional but recommended)

### Software Dependencies
```bash
# macOS
brew install python@3.11 postgresql redis cmake dlib

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3.11 python3-pip postgresql redis-server cmake libopenblas-dev liblapack-dev

# Install Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Note: dlib and face_recognition may take time to compile
# If you encounter issues, install pre-built wheels:
pip install dlib-binary
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configurations
nano .env  # or use your preferred editor
```

**Critical Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/campus_attendance

# JWT Secret (IMPORTANT: Change in production!)
JWT_SECRET_KEY=your-super-secret-key-min-32-characters-long

# AI Settings
FACE_DETECTION_CONFIDENCE=0.7
FACE_RECOGNITION_TOLERANCE=0.6

# RFID (if using hardware)
RFID_PORT=/dev/ttyUSB0
RFID_BAUDRATE=9600

# Email (for notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### 3. Initialize Database

```bash
# Create PostgreSQL database
createdb campus_attendance

# Or using psql
psql -U postgres
CREATE DATABASE campus_attendance;
\q

# Run migrations (if using Alembic)
alembic upgrade head

# Or the application will auto-create tables on first run
```

### 4. Download AI Models

```bash
# Create models directory
mkdir -p models

# The face_recognition library will auto-download models on first use
# For faster performance, pre-download:
python scripts/download_models.py
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd ..  # Back to project root
npm install
# or
yarn install
```

### 2. Configure Frontend Environment

```bash
# Check .env file in root directory
cat .env
```

Ensure these variables are set:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_API_URL=http://localhost:8000  # Backend API URL
```

### 3. Build Frontend

```bash
npm run build
# or for development
npm run dev
```

## Database Setup

### PostgreSQL Schema

The database will be automatically created on first run, but you can manually create it:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE campus_attendance;

-- Connect to the database
\c campus_attendance

-- Verify tables (after running backend)
\dt

-- Tables should include:
-- users, face_encodings, rfid_cards, cameras, attendance_records,
-- notifications, audit_logs, system_settings, alerts, reports, schedules
```

### Sample Data (Optional)

```bash
# Run seed script to create sample data
python backend/scripts/seed_database.py
```

## AI Model Configuration

### Face Recognition Models

The system supports multiple face detection methods:

1. **HOG (Histogram of Oriented Gradients)** - Fast, CPU-friendly
2. **CNN (Convolutional Neural Network)** - More accurate, requires GPU
3. **MTCNN** - Multi-task cascaded CNN for better detection
4. **DeepFace** - Multiple model support (VGG-Face, Facenet, OpenFace)

Configure in `.env`:
```env
FACE_MODEL=hog  # or 'cnn' for GPU
FACE_ENCODING_MODEL=large  # or 'small' for faster processing
```

### GPU Acceleration (Optional)

For CUDA support (NVIDIA GPUs):
```bash
# Install CUDA toolkit
# Follow: https://developer.nvidia.com/cuda-downloads

# Install GPU-enabled TensorFlow
pip uninstall tensorflow
pip install tensorflow-gpu==2.15.0
```

## RFID Hardware Setup

### Supported RFID Readers
- RC522 RFID Module
- PN532 NFC/RFID Module
- USB RFID Readers

### Connection Setup

For RC522 with Raspberry Pi:
```bash
# Enable SPI
sudo raspi-config
# Interface Options -> SPI -> Enable

# Install Python SPI library
pip install spidev mfrc522
```

For USB RFID readers:
```bash
# Find device
ls /dev/ttyUSB*
# or
ls /dev/ttyACM*

# Set permissions
sudo usermod -a -G dialout $USER
# Log out and back in
```

Update `.env`:
```env
RFID_PORT=/dev/ttyUSB0  # Your device path
RFID_BAUDRATE=9600
```

## Camera Configuration

### Supported Cameras
- USB Webcams
- IP Cameras (RTSP/HTTP streams)
- Raspberry Pi Camera Module
- Network cameras (ONVIF compatible)

### Adding Cameras via API

```bash
curl -X POST http://localhost:8000/api/v1/cameras \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Main Entrance",
    "location": "Building A - Ground Floor",
    "camera_url": "rtsp://192.168.1.100:554/stream",
    "camera_type": "ip",
    "resolution": "1920x1080",
    "fps": 30
  }'
```

### Test Camera Connection

```bash
# Test with OpenCV
python backend/scripts/test_camera.py --url "rtsp://camera-url"
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Access at http://localhost:5173
```

**Terminal 3 - Redis (if using):**
```bash
redis-server
```

### Production Mode

```bash
# Backend with Gunicorn
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend
npm run build
npm run preview
# or serve with nginx/apache
```

## API Documentation

### Access Interactive API Docs

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token

#### Face Recognition
- `POST /api/v1/face/enroll` - Enroll user face
- `POST /api/v1/face/verify` - Verify face
- `GET /api/v1/face/encodings/{user_id}` - Get user encodings

#### Attendance
- `POST /api/v1/attendance/check-in` - Mark check-in
- `POST /api/v1/attendance/check-out` - Mark check-out
- `GET /api/v1/attendance/records` - Get attendance records

#### User Management
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=. --cov-report=html
```

### Frontend Tests

```bash
npm run test
npm run test:coverage
```

### Integration Tests

```bash
# Test full flow
python backend/tests/test_integration.py
```

## Deployment

### Docker Deployment

```bash
# Build images
docker-compose build

# Run services
docker-compose up -d

# Check status
docker-compose ps
```

### Manual Deployment (Ubuntu Server)

```bash
# Install nginx
sudo apt install nginx

# Configure nginx
sudo nano /etc/nginx/sites-available/attendance-system

# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/attendance-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Systemd Service (Backend)

```bash
sudo nano /etc/systemd/system/attendance-api.service
```

```ini
[Unit]
Description=AI Campus Attendance API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/attendance-system/backend
Environment="PATH=/var/www/attendance-system/backend/venv/bin"
ExecStart=/var/www/attendance-system/backend/venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable attendance-api
sudo systemctl start attendance-api
sudo systemctl status attendance-api
```

## Troubleshooting

### Common Issues

**1. Face Recognition Installation Fails**
```bash
# Install build dependencies
sudo apt-get install build-essential cmake
pip install dlib --no-cache-dir
```

**2. Database Connection Error**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# Check connection
psql -U postgres -h localhost
```

**3. RFID Not Detected**
```bash
# Check device
ls -l /dev/ttyUSB*
# Test serial connection
python -m serial.tools.miniterm /dev/ttyUSB0 9600
```

**4. Camera Stream Not Working**
```bash
# Test with ffplay
ffplay -rtsp_transport tcp rtsp://camera-url
# Check permissions
sudo usermod -aG video $USER
```

## Performance Optimization

### Backend Optimization
- Use Redis for caching
- Enable database connection pooling
- Use Gunicorn with multiple workers
- Enable gzip compression in nginx

### AI Model Optimization
- Use HOG model instead of CNN for CPU
- Batch face recognition requests
- Cache face encodings
- Use lower resolution for detection

### Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, check_in_time);
CREATE INDEX idx_face_encodings_user ON face_encodings(user_id);
```

## Security Best Practices

1. **Change default JWT secret** in production
2. **Use HTTPS** with valid SSL certificates
3. **Enable rate limiting** on API endpoints
4. **Regular backups** of database
5. **Update dependencies** regularly
6. **Use environment variables** for sensitive data
7. **Implement API authentication** on all endpoints
8. **Enable audit logging** for all critical operations

## Support and Documentation

- **API Docs**: http://localhost:8000/docs
- **GitHub Issues**: [Project Repository]
- **Email**: support@your-domain.com

## License

[Your License Here]

---

**Built with ❤️ for Campus Security and Efficiency**
