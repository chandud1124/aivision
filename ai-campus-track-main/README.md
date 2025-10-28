# 🎓 AI Campus Attendance Tracker

## Complete AI-Powered Attendance Management System

A production-ready, enterprise-grade attendance tracking system featuring:

- **🤖 Advanced AI Face Recognition** - Multi-algorithm detection (HOG, CNN, MTCNN, DeepFace)
- **💳 RFID Integration** - Card-based attendance with hardware support
- **📹 Live Camera Management** - Multi-camera support with real-time streaming
- **👥 Role-Based Access Control** - Admin, Teacher, Student, Security roles
- **📊 Comprehensive Analytics** - Reports, statistics, and insights
- **🔔 Smart Notifications** - Email, SMS, and real-time alerts
- **🔒 Enterprise Security** - JWT authentication, audit trails, encryption
- **📱 API-First Design** - Mobile-ready REST API with full documentation

---

## ⚡ Quick Start

### Option 1: Automated Setup (Recommended)

```bash
chmod +x quick-start.sh
./quick-start.sh
```

### Option 2: Docker (Fastest)

```bash
docker-compose up -d
```

### Option 3: Manual Setup

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
npm install
npm run dev
```

### Access Points
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **API**: http://localhost:8000
- 📖 **API Docs**: http://localhost:8000/docs

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) | Detailed installation and configuration guide |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Complete feature overview and architecture |
| [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) | Implementation details and what's been built |
| [API Docs](http://localhost:8000/docs) | Interactive API documentation (Swagger UI) |

---

## ✨ Key Features

### Authentication & Security
✅ JWT-based authentication with refresh tokens  
✅ Role-based access control (4 roles, 10+ permissions)  
✅ Password hashing with bcrypt  
✅ Session management with Redis  
✅ Account lockout protection  
✅ Comprehensive audit logging  

### AI Face Recognition
✅ Multiple detection algorithms (HOG, CNN, MTCNN)  
✅ Real-time face verification  
✅ 128-dimensional face encodings  
✅ Database matching with confidence scoring  
✅ GPU acceleration support  
✅ DeepFace integration  

### Attendance Management
✅ Check-in/Check-out tracking  
✅ Multi-method verification (Face + RFID)  
✅ Automatic late marking  
✅ Duration calculation  
✅ Location and camera tracking  
✅ Temperature logging (COVID-ready)  

### System Administration
✅ User management (CRUD operations)  
✅ Camera configuration and monitoring  
✅ RFID card management  
✅ System settings and configuration  
✅ Comprehensive reporting  
✅ Alert and notification system  

---

## 🏗️ Technology Stack

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL 15+
- Redis 7+
- SQLAlchemy ORM
- OpenCV, dlib, TensorFlow
- JWT Authentication

**Frontend:**
- React 18+ with TypeScript
- Vite
- TailwindCSS
- shadcn/ui components
- React Query
- Supabase integration

**DevOps:**
- Docker & Docker Compose
- Nginx reverse proxy
- GitHub Actions ready
- Production-ready architecture

---

## 📁 Project Structure

```
ai-campus-track-main/
├── backend/               # FastAPI backend
│   ├── config/           # Configuration
│   ├── models/           # Database models (11 tables)
│   ├── services/         # Business logic (AI, RFID, Auth)
│   ├── main.py          # FastAPI application (15+ endpoints)
│   └── requirements.txt  # Python dependencies
├── src/                  # React frontend
├── docker-compose.yml    # Docker orchestration
├── quick-start.sh        # Automated setup script
└── docs/                 # Comprehensive documentation
```

---

## 🚀 API Endpoints

### Authentication
```bash
POST   /api/v1/auth/register  # Register new user
POST   /api/v1/auth/login     # User login
```

### Face Recognition
```bash
POST   /api/v1/face/enroll    # Enroll user face
POST   /api/v1/face/verify    # Verify face
```

### Attendance
```bash
POST   /api/v1/attendance/check-in   # Mark check-in
POST   /api/v1/attendance/check-out  # Mark check-out
GET    /api/v1/attendance/records    # Get records
```

### User Management
```bash
GET    /api/v1/users         # List users
POST   /api/v1/users         # Create user
GET    /api/v1/users/{id}    # Get user
PUT    /api/v1/users/{id}    # Update user
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
npm run test
```

---

## 🌐 Deployment

### Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment
See [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md) for detailed production deployment instructions including:
- AWS, Azure, Google Cloud
- Nginx configuration
- SSL/HTTPS setup
- Performance optimization

---

## 📊 What's Included

✅ **2000+ lines** of production-ready Python code  
✅ **15+ API endpoints** with full documentation  
✅ **11 database tables** with relationships  
✅ **3 major services** (Auth, AI, RFID)  
✅ **4 user roles** with granular permissions  
✅ **Complete documentation** (1500+ lines)  
✅ **Docker support** with compose configuration  
✅ **Security best practices** implemented  

---

## 🔒 Security Features

- JWT tokens with expiration
- Password hashing with bcrypt
- SQL injection prevention (ORM)
- XSS protection
- CORS configuration
- Rate limiting ready
- Audit logging
- Role-based permissions

---

## 💡 Use Cases

- Universities and colleges
- Corporate offices
- Schools and training centers
- Government institutions
- Healthcare facilities
- Research laboratories
- Any organization requiring automated attendance

---

## 🤝 Support

- **Documentation**: See complete documentation files
- **API Docs**: http://localhost:8000/docs
- **Issues**: GitHub Issues

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- FastAPI
- React
- OpenCV
- dlib
- TensorFlow
- PostgreSQL
- And many other amazing open-source projects

---

**Made with ❤️ for Educational Institutions**

*Production-ready • Well-documented • Scalable • Secure*
