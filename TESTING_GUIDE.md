# Testing Guide - AI Campus Attendance Tracker

## ✅ Step-by-Step Testing Instructions

This guide will help you test the project completely and verify everything works.

## Prerequisites Check

```bash
# 1. Check Python version (need 3.9+)
python3 --version

# 2. Check Node.js version (need 18+)
node --version

# 3. Check if PostgreSQL is installed
psql --version

# If not installed:
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
```

## Phase 1: Basic Backend Setup (5 minutes)

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Upgrade pip
```bash
pip install --upgrade pip
```

### Step 4: Install Core Dependencies (No AI)
```bash
pip install -r requirements.txt
```

**Expected output**: Should install successfully without errors
**If errors occur**: Note the error and continue - we'll fix it

### Step 5: Verify Python Files Compile
```bash
python3 -m py_compile main.py
python3 -m py_compile config/settings.py
python3 -m py_compile models/database_models.py
python3 -m py_compile services/auth_service.py
```

**Expected output**: No output means success ✅

## Phase 2: Database Setup (3 minutes)

### Step 1: Create PostgreSQL Database
```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
createdb campus_attendance

# Verify database was created
psql -l | grep campus_attendance
```

**Expected output**: You should see `campus_attendance` in the list

### Step 2: Update .env File
```bash
# Check if .env exists
ls -la | grep .env

# The file should already exist with default values
# Verify the DATABASE_URL is correct:
grep DATABASE_URL .env
```

**Expected**: `DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_attendance`

If your PostgreSQL password is different, update it in `.env`

## Phase 3: Test Backend API (5 minutes)

### Step 1: Try Starting the Server
```bash
# Make sure you're in backend directory with venv activated
python main.py
```

**What to check**:
1. ✅ Server starts without errors
2. ✅ You see "Starting AI Campus Attendance Tracker API"
3. ✅ You see "Application startup complete"
4. ✅ You see "Uvicorn running on http://0.0.0.0:8000"

**Common issues**:

**Issue 1**: `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Solution: Install dependencies again
pip install -r requirements.txt
```

**Issue 2**: `Could not connect to database`
```bash
# Solution: Check PostgreSQL is running and credentials are correct
pg_isready
# Update DATABASE_URL in .env if needed
```

**Issue 3**: `AI libraries not available warning`
```
✅ This is OKAY! The system works without AI features.
To add AI: pip install -r requirements-ai.txt
```

### Step 2: Test API Documentation
**Open browser**: http://localhost:8000/docs

**What you should see**:
- ✅ Swagger UI interface
- ✅ List of API endpoints
- ✅ Sections: Authentication, Users, Face Recognition, Attendance

### Step 3: Test Health Check
```bash
# In a new terminal:
curl http://localhost:8000/health
```

**Expected output**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T...",
  "version": "1.0.0"
}
```

### Step 4: Test User Registration

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@test.com&username=admin&password=Admin123!&full_name=Test Admin&role=admin"
```

**Expected output**:
```json
{
  "message": "User registered successfully",
  "user_id": 1,
  "username": "admin"
}
```

### Step 5: Test User Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123!"
```

**Expected output**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@test.com",
    "full_name": "Test Admin",
    "role": "admin"
  }
}
```

✅ **If you see this, your backend is working perfectly!**

## Phase 4: Frontend Testing (5 minutes)

### Step 1: Navigate to Project Root
```bash
cd ..  # Go back to project root
```

### Step 2: Install Frontend Dependencies
```bash
npm install
```

**Expected**: Should install without major errors
**Note**: Some warnings are okay

### Step 3: Start Frontend
```bash
npm run dev
```

**What to check**:
1. ✅ Vite server starts
2. ✅ You see "Local: http://localhost:5173"
3. ✅ No fatal errors

### Step 4: Test Frontend in Browser
**Open**: http://localhost:5173

**What to check**:
- ✅ Page loads without errors
- ✅ UI is visible
- ✅ No console errors (press F12)

## Phase 5: Integration Testing (5 minutes)

### Test 1: User List API
```bash
# Get the access token from login response above, then:
curl -X GET "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected**: List of users including the admin you created

### Test 2: Attendance Check-in
```bash
curl -X POST "http://localhost:8000/api/v1/attendance/check-in" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "user_id": 1,
    "verification_method": "manual"
  }'
```

**Expected**: Success message with attendance_id

### Test 3: Get Attendance Records
```bash
curl -X GET "http://localhost:8000/api/v1/attendance/records?user_id=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected**: List of attendance records

## Phase 6: AI Features Testing (Optional - 10 minutes)

### Step 1: Install AI Dependencies
```bash
cd backend
source venv/bin/activate

# On macOS, install system dependencies first:
brew install cmake dlib

# Install AI requirements
pip install -r requirements-ai.txt
```

**Note**: This may take 5-10 minutes

### Step 2: Restart Backend
```bash
# Stop the current server (Ctrl+C)
python main.py
```

**What to check**:
- ✅ No "AI libraries not available" warning
- ✅ "Face Recognition Service initialized (AI available: True)"

### Step 3: Test Face Recognition
Use the Swagger UI at http://localhost:8000/docs

1. Find "POST /api/v1/face/enroll"
2. Click "Try it out"
3. Upload a photo
4. Set user_id to 1
5. Execute

**Expected**: Success message

## Phase 7: Docker Testing (Optional - 5 minutes)

### Prerequisites
```bash
# Check if Docker is installed
docker --version
docker-compose --version
```

### Test Docker Deployment
```bash
# From project root
docker-compose up -d
```

**What to check**:
1. ✅ All services start (postgres, redis, backend, frontend)
2. ✅ No fatal errors

**Check status**:
```bash
docker-compose ps
```

**Expected**: All services should be "Up"

**Access**:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Stop services**:
```bash
docker-compose down
```

## ✅ Testing Checklist

Use this checklist to track your testing progress:

### Backend Tests
- [ ] Python 3.9+ installed
- [ ] Virtual environment created
- [ ] Core dependencies installed
- [ ] Database created
- [ ] Backend server starts
- [ ] API docs accessible (http://localhost:8000/docs)
- [ ] Health check works
- [ ] User registration works
- [ ] User login works
- [ ] JWT token received
- [ ] User list API works
- [ ] Attendance check-in works
- [ ] Attendance records retrieval works

### Frontend Tests
- [ ] Node.js 18+ installed
- [ ] npm install successful
- [ ] Frontend server starts
- [ ] Frontend loads in browser
- [ ] No console errors

### Optional Tests
- [ ] AI dependencies installed
- [ ] Face recognition service available
- [ ] Face enrollment works
- [ ] Docker installed
- [ ] Docker compose starts all services
- [ ] All containers running

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError"
**Solution**:
```bash
pip install -r requirements.txt
# Or install the specific package:
pip install fastapi uvicorn sqlalchemy
```

### Issue: "Database connection error"
**Solution**:
```bash
# Check PostgreSQL status
pg_isready
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Create database if doesn't exist
createdb campus_attendance
```

### Issue: "Port already in use"
**Solution**:
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Or change port in backend/.env
PORT=8001
```

### Issue: "AI libraries not installing"
**Solution**:
```bash
# macOS
brew install cmake dlib
pip install dlib

# Linux
sudo apt-get install cmake libopenblas-dev liblapack-dev
pip install dlib
```

## 📊 Expected Test Results

### ✅ Successful Test Output

**Backend Start**:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**User Registration**:
```json
{
  "message": "User registered successfully",
  "user_id": 1,
  "username": "admin"
}
```

**Login**:
```json
{
  "access_token": "eyJ...",
  "user": {...}
}
```

## 🎉 Success Criteria

Your testing is successful if:

1. ✅ Backend starts without fatal errors
2. ✅ API documentation loads
3. ✅ User can register
4. ✅ User can login and get JWT token
5. ✅ Basic API endpoints work (users, attendance)
6. ✅ Frontend starts and loads
7. ✅ Database connection works

**Note**: AI features are optional - the system works without them!

## 📝 Next Steps After Testing

If all tests pass:
1. Read COMPLETE_SETUP_GUIDE.md for production deployment
2. Explore API documentation at /docs
3. Install AI features if needed
4. Configure email notifications (optional)
5. Set up cameras and RFID readers (optional)

## 🆘 Getting Help

If tests fail:
1. Check the error message carefully
2. Look for the error in this troubleshooting guide
3. Check logs for more details
4. Verify all prerequisites are installed
5. Try Docker deployment as alternative

---

**Good luck with testing! 🚀**
