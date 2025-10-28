# AI Campus Track - Intelligent Attendance Management System

## 🎯 System Overview

A production-grade, AI-powered attendance management system combining **RFID authentication** with **facial verification** and **anti-spoofing detection** for large educational institutes.

### Key Features
- ✅ RFID + Face Verification (Dual Authentication)
- 🤖 AI-Powered Face Detection (YOLOv8 + DeepFace + MediaPipe)
- 🛡️ Anti-Spoofing (Detects fake photos, videos, masks)
- ⏰ Hourly & Timetable-based Automated Attendance
- 📹 Multi-Camera Integration (RTSP/IP/ESP32-CAM)
- 🔐 Role-Based Access Control (SuperAdmin, HOD, Teacher, Student)
- 🚨 Real-time Alerts (Face Mismatch, Unknown Faces, Duplicates)
- 📊 Comprehensive Reports & Analytics
- 🌐 RESTful API + WebSocket for Real-time Updates

---

## 🏗️ Architecture

```
├── backend/               # Node.js + Express API Server
│   ├── controllers/      # Business logic
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth, validation, error handling
│   ├── services/         # External integrations
│   └── utils/            # Helper functions
│
├── ai-service/           # Python AI Engine
│   ├── models/           # YOLOv8, DeepFace, MediaPipe
│   ├── api/              # Flask/FastAPI endpoints
│   ├── processing/       # Face detection, verification, anti-spoof
│   ├── training/         # Model training scripts
│   └── utils/            # Image processing utilities
│
├── frontend/             # React + TypeScript Dashboard
│   ├── src/
│   │   ├── pages/        # Dashboard, Students, Attendance, etc.
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API communication
│   │   ├── store/        # State management
│   │   └── types/        # TypeScript definitions
│
├── rfid-firmware/        # ESP32/Arduino RFID Reader Code
│   ├── esp32/            # ESP32 firmware
│   ├── raspberry-pi/     # Raspberry Pi integration
│   └── protocols/        # Communication protocols
│
└── deployment/           # Docker, Kubernetes, CI/CD
    ├── docker/           # Dockerfiles
    ├── k8s/              # Kubernetes manifests
    └── scripts/          # Deployment automation
```

---

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO
- **API Documentation**: Swagger/OpenAPI

### AI Service
- **Language**: Python 3.10+
- **Framework**: FastAPI
- **Face Detection**: YOLOv8 (Ultralytics)
- **Face Recognition**: DeepFace (VGGFace, ArcFace, Facenet)
- **Anti-Spoofing**: MediaPipe + Custom CNN
- **Image Processing**: OpenCV, PIL
- **Deep Learning**: TensorFlow, PyTorch

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Query + Zustand
- **Charts**: Recharts
- **Routing**: React Router v6

### Hardware Integration
- **RFID Readers**: MFRC522, PN532, 125kHz readers
- **Microcontrollers**: ESP32, NodeMCU, Raspberry Pi
- **Cameras**: IP cameras (RTSP), USB cameras, ESP32-CAM
- **Communication**: MQTT, HTTP REST, WebSocket

---

## 📋 Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS, Windows with WSL2
- **RAM**: Minimum 8GB (16GB recommended)
- **GPU**: NVIDIA GPU with CUDA support (optional but recommended for AI)
- **Storage**: 50GB+ free space

### Software Dependencies
- Node.js >= 20.0
- Python >= 3.10
- MongoDB >= 6.0
- Redis >= 7.0 (for caching)
- Docker & Docker Compose (for containerized deployment)

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/ai-campus-track.git
cd ai-campus-track
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Setup AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python app.py
```

### 4. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URLs
npm run dev
```

### 5. Setup MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Or install locally
brew install mongodb-community  # macOS
```

### 6. Initialize Database
```bash
cd backend
npm run seed  # Creates default admin user and sample data
```

---

## 🔐 Default Credentials

**Super Admin**
- Email: admin@campus.edu
- Password: Admin@123456

**HOD (Computer Science)**
- Email: hod.cs@campus.edu
- Password: Hod@123456

**Teacher**
- Email: teacher@campus.edu
- Password: Teacher@123456

**Student**
- Roll: STU001
- Password: Student@123

⚠️ **Change all default passwords immediately after first login!**

---

## 📁 Project Structure Details

### Backend API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password with token

#### Users
- `GET /api/users` - List users (with role-based filtering)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/bulk-import` - Bulk import from CSV

#### Students
- `GET /api/students` - List students
- `POST /api/students` - Add student
- `PUT /api/students/:id` - Update student
- `POST /api/students/:id/photo` - Upload face photo
- `POST /api/students/:id/assign-rfid` - Assign RFID card
- `GET /api/students/:id/attendance` - Get attendance records

#### Attendance
- `POST /api/attendance/rfid-tap` - RFID tap event
- `POST /api/attendance/verify-face` - Face verification result
- `GET /api/attendance/class/:classId` - Get class attendance
- `GET /api/attendance/hourly` - Hourly attendance logs
- `POST /api/attendance/manual` - Manual attendance entry
- `GET /api/attendance/export` - Export attendance report

#### Devices
- `GET /api/devices/rfid` - List RFID readers
- `POST /api/devices/rfid` - Register RFID reader
- `PUT /api/devices/rfid/:id` - Update reader config
- `POST /api/devices/rfid/:id/test` - Test connection
- `GET /api/devices/cameras` - List cameras
- `POST /api/devices/cameras` - Register camera
- `GET /api/devices/cameras/:id/stream` - Get camera stream URL

#### Alerts
- `GET /api/alerts` - List alerts
- `GET /api/alerts/unresolved` - Get unresolved alerts
- `PUT /api/alerts/:id/resolve` - Mark alert as resolved
- `POST /api/alerts/test` - Send test notification

#### Reports
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/verification-accuracy` - AI accuracy stats
- `GET /api/reports/device-health` - Device status report
- `GET /api/reports/department-summary` - Department-wise summary

---

## 🤖 AI Service Endpoints

#### Face Verification
- `POST /api/ai/detect-face` - Detect faces in image
- `POST /api/ai/verify-face` - Verify identity
- `POST /api/ai/anti-spoof` - Check for liveness
- `POST /api/ai/enroll-face` - Register new face
- `GET /api/ai/model-status` - AI model health check

#### Training
- `POST /api/ai/train/student` - Train model for student
- `POST /api/ai/retrain` - Retrain all models
- `GET /api/ai/train/status` - Training job status

---

## 🔄 Attendance Flow

```
1. Student taps RFID card
   ↓
2. RFID reader sends card ID to backend
   ↓
3. Backend identifies student & triggers camera
   ↓
4. Camera captures frame
   ↓
5. AI Service processes frame:
   - Face Detection (YOLOv8)
   - Face Recognition (DeepFace)
   - Anti-Spoofing (MediaPipe)
   ↓
6. Verification result:
   ✅ Match + Live → Mark attendance
   ❌ Mismatch → Retry (2x) → Alert teacher
   ⚠️ Spoof detected → Security alert
   ❓ Unknown face → Admin alert
   ↓
7. Update database & notify relevant users
   ↓
8. Visual/audio feedback to student (LED/Buzzer)
```

---

## 🛡️ Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt (12 rounds)
- Rate limiting on API endpoints
- CORS configuration
- Input validation with Joi/Zod
- SQL injection prevention (using ODM)
- XSS protection
- HTTPS enforcement
- API key authentication for devices
- Encrypted sensitive data at rest
- Audit logging for all critical actions

---

## 📊 Database Schema

### Collections
- `users` - All system users (SuperAdmin, HOD, Teacher, Student)
- `students` - Student-specific data
- `staff` - Staff/teacher data
- `departments` - Departments and courses
- `classes` - Class schedules and timetables
- `attendance` - Attendance records
- `rfid_devices` - RFID reader configurations
- `cameras` - Camera configurations
- `face_embeddings` - Stored face embeddings for recognition
- `verification_logs` - AI verification history
- `alerts` - System alerts and notifications
- `audit_logs` - System audit trail
- `settings` - System configurations

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                 # Run all tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:coverage   # Coverage report

# AI Service tests
cd ai-service
pytest                   # Run all tests
pytest tests/test_face_detection.py  # Specific test
pytest --cov=app tests/  # With coverage

# Frontend tests
cd frontend
npm test                # Jest tests
npm run test:e2e       # Cypress E2E tests
```

---

## 📦 Deployment

### Docker Compose (Recommended for Development)
```bash
docker-compose up -d
```

### Production Deployment
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale ai-service=3
```

### Kubernetes
```bash
kubectl apply -f deployment/k8s/
kubectl get pods
kubectl logs -f deployment/backend
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus-track
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=7d
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### AI Service (.env)
```env
FLASK_ENV=production
PORT=8000
MODEL_PATH=./models
FACE_DETECTION_MODEL=yolov8n-face.pt
FACE_RECOGNITION_MODEL=VGGFace
ANTI_SPOOF_MODEL=./models/anti_spoof.h5
CONFIDENCE_THRESHOLD=0.85
GPU_ENABLED=true
BATCH_SIZE=8
```

---

## 📈 Performance Optimization

- **Caching**: Redis for frequently accessed data
- **Database Indexing**: Optimized queries with proper indexes
- **Image Compression**: Reduce bandwidth for camera streams
- **Load Balancing**: Nginx reverse proxy
- **CDN**: Static asset delivery
- **Horizontal Scaling**: Multiple AI service instances
- **Connection Pooling**: Database connection management

---

## 🐛 Troubleshooting

### Common Issues

**AI Service not detecting faces**
```bash
# Check model files
ls -lah ai-service/models/
# Reinstall dependencies
pip install --upgrade ultralytics deepface opencv-python
```

**MongoDB connection failed**
```bash
# Check MongoDB status
sudo systemctl status mongod
# Restart MongoDB
sudo systemctl restart mongod
```

**RFID reader not connecting**
- Verify device is on same network
- Check API key configuration
- Test with: `curl http://<reader-ip>/health`

---

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Hardware Setup Guide](./docs/HARDWARE.md)
- [AI Model Training](./docs/AI_TRAINING.md)
- [Admin User Guide](./docs/ADMIN_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 👥 Support

- **Email**: support@aicampustrack.com
- **Documentation**: https://docs.aicampustrack.com
- **Issues**: https://github.com/your-org/ai-campus-track/issues

---

## 🙏 Acknowledgments

- YOLOv8 by Ultralytics
- DeepFace by serengil
- MediaPipe by Google
- shadcn/ui components
- Open source community

---

**Built with ❤️ for Educational Institutions**
