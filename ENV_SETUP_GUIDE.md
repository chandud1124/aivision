# 🔧 Environment Variables Setup Guide

This guide explains how to configure the `.env` files for both frontend and backend.

---

## 📁 File Locations

```
ai-campus-track-main/
├── .env                 # Frontend config
├── .env.example         # Frontend template
├── backend/
│   ├── .env            # Backend config
│   └── .env.example    # Backend template
```

---

## 🎨 Frontend Configuration

### Location: `.env` (project root)

This file is **already configured** for local development!

```env
# Backend API Configuration
VITE_API_URL=http://localhost:8000
```

### What It Does:
- Tells the frontend (React) where to find the backend API
- `VITE_` prefix is required for Vite to expose variables to the browser

### When to Change:
- **Local Development:** Leave as-is
- **Production:** Change to your production backend URL
  ```env
  VITE_API_URL=https://api.yourdomain.com
  ```

---

## ⚙️ Backend Configuration

### Location: `backend/.env`

This file is **already configured** with sensible defaults!

### Essential Settings (Already Set)

#### 1. Application
```env
APP_NAME="AI Campus Attendance Tracker"
APP_ENV=development
DEBUG=true
PORT=8000
```
✅ **No changes needed** for local development

#### 2. Database
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_attendance
```

**When to change:**
- If you installed PostgreSQL manually with different credentials
- Update `postgres:password` to your actual username:password
- Example: `postgresql://myuser:mypassword@localhost:5432/campus_attendance`

✅ **If using Docker Compose:** Leave as-is (default docker setup)

#### 3. JWT Security
```env
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

✅ **For local dev:** Current value is fine
⚠️ **For production:** MUST change `JWT_SECRET_KEY` to a long random string

Generate a secure key:
```bash
openssl rand -hex 32
```

#### 4. CORS
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_CREDENTIALS=true
```

✅ **No changes needed** - allows both Vite dev server ports

---

## 📋 Optional Settings

These are configured but not required for basic functionality:

### Redis (Optional - for caching)
```env
REDIS_URL=redis://localhost:6379/0
```
- Used for caching and background tasks
- App works without Redis

### Email Notifications (Optional)
```env
SENDGRID_API_KEY=your-sendgrid-api-key-here
FROM_EMAIL=noreply@campus-attendance.com
ENABLE_EMAIL_NOTIFICATIONS=false
```
- Set to `false` by default
- Configure SendGrid if you want email alerts

### AI Face Recognition (Optional)
```env
FACE_DETECTION_CONFIDENCE=0.7
FACE_RECOGNITION_TOLERANCE=0.6
```
- For future AI features
- Not required for basic attendance

---

## 🚀 Quick Setup

### First Time Setup

1. **Frontend .env** (already exists)
   ```bash
   # Check it exists
   cat .env
   
   # Should show:
   # VITE_API_URL=http://localhost:8000
   ```

2. **Backend .env** (already exists)
   ```bash
   # Check it exists
   cat backend/.env
   
   # Should show database config, JWT settings, etc.
   ```

### If Files Don't Exist

```bash
# Copy from templates
cp .env.example .env
cp backend/.env.example backend/.env
```

---

## ✅ Verification

### Check Frontend Config
```bash
cat .env | grep VITE_API_URL
```
Should output: `VITE_API_URL=http://localhost:8000`

### Check Backend Config
```bash
cat backend/.env | grep DATABASE_URL
```
Should output: `DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_attendance`

---

## 🔐 Security Best Practices

### For Local Development ✅
- Current settings are fine
- Uses default credentials
- Debug mode enabled

### For Production ⚠️
You MUST change:

1. **JWT Secret Key**
   ```env
   JWT_SECRET_KEY=<use-openssl-rand-hex-32>
   ```

2. **Database Password**
   ```env
   DATABASE_URL=postgresql://user:STRONG_PASSWORD@host:5432/db
   ```

3. **Debug Mode**
   ```env
   DEBUG=false
   APP_ENV=production
   ```

4. **CORS Origins**
   ```env
   CORS_ORIGINS=https://yourdomain.com
   ```

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
**Issue:** CORS errors in browser console

**Solution:**
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify frontend .env:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
3. Verify backend CORS setting:
   ```env
   CORS_ORIGINS=http://localhost:5173
   ```

### Backend won't start - Database error
**Issue:** Can't connect to PostgreSQL

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   docker ps | grep campus_postgres
   ```
2. Check database URL matches your setup:
   ```env
   # For Docker:
   DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_attendance
   
   # For local PostgreSQL:
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/campus_attendance
   ```

### Backend won't start - Port already in use
**Issue:** Port 8000 already taken

**Solution:**
1. Change port in backend/.env:
   ```env
   PORT=8001
   ```
2. Update frontend .env:
   ```env
   VITE_API_URL=http://localhost:8001
   ```

---

## 📝 Environment Variables Reference

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ Yes | `http://localhost:8000` | Backend API URL |

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection | Database connection string |
| `JWT_SECRET_KEY` | ✅ Yes | (dev key) | JWT signing key |
| `PORT` | ✅ Yes | `8000` | Backend server port |
| `CORS_ORIGINS` | ✅ Yes | localhost URLs | Allowed frontend URLs |
| `REDIS_URL` | ❌ No | localhost | Redis for caching |
| `SENDGRID_API_KEY` | ❌ No | - | Email service |

---

## 🎯 Common Scenarios

### Scenario 1: Fresh Installation
```bash
# Files already exist with correct defaults
# Just start the servers!
```

### Scenario 2: Changed Database Password
```bash
# Edit backend/.env
DATABASE_URL=postgresql://myuser:newpassword@localhost:5432/campus_attendance
```

### Scenario 3: Different Backend Port
```bash
# backend/.env
PORT=8001

# .env (frontend)
VITE_API_URL=http://localhost:8001
```

### Scenario 4: Deploying to Production
```bash
# backend/.env
APP_ENV=production
DEBUG=false
JWT_SECRET_KEY=<random-64-char-string>
DATABASE_URL=postgresql://user:pass@prod-server:5432/db
CORS_ORIGINS=https://yourdomain.com

# .env (frontend)
VITE_API_URL=https://api.yourdomain.com
```

---

## 📚 Summary

✅ **Already Configured:**
- Frontend `.env` → Points to `localhost:8000`
- Backend `.env` → Uses Docker PostgreSQL defaults
- CORS → Allows localhost frontend
- JWT → Has dev secret (change for production)

✅ **No Action Needed for Local Dev:**
- Everything works out of the box!
- Just start Docker, backend, and frontend

⚠️ **Action Needed Only If:**
- Using local PostgreSQL (not Docker) → Update credentials
- Deploying to production → Change security settings
- Need email/Redis features → Configure optional services

---

**Your environment is ready! Start developing! 🚀**
