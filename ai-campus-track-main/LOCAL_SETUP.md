# Local Development Setup - 100% Localhost

This application runs **completely locally** with no cloud dependencies. All Supabase references have been removed.

## ✅ What You Need

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **PostgreSQL** (local database)
- **Redis** (optional, for caching)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Setup Database

```bash
# Start PostgreSQL (if not running)
# Mac with Homebrew:
brew services start postgresql@14

# Create database
createdb campus_attendance

# Or using psql:
psql postgres
CREATE DATABASE campus_attendance;
\q
```

### Step 2: Setup Backend

```bash
# Go to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (create tables)
alembic upgrade head

# Start backend server
python main.py
```

Backend should now be running on **http://localhost:8000**

### Step 3: Setup Frontend

```bash
# Open new terminal
# Go to project root
cd /Users/chandu/Downloads/ai-campus-track-main

# Install dependencies (if not done)
npm install

# Start frontend dev server
npm run dev
```

Frontend should now be running on **http://localhost:5173**

### Step 4: Access Application

1. Open browser: **http://localhost:5173**
2. Register a new user
3. Login
4. Start using the app!

---

## 📁 Project Structure

```
ai-campus-track-main/
├── backend/               # FastAPI backend
│   ├── main.py           # Backend entry point
│   ├── requirements.txt  # Python dependencies
│   ├── .env             # Backend config (local)
│   └── app/             # Application code
├── src/                  # React frontend
│   ├── pages/           # All pages
│   ├── components/      # Reusable components
│   ├── contexts/        # Auth context (no Supabase!)
│   ├── hooks/           # API hooks
│   └── lib/             # Utilities (axios client)
├── .env                  # Frontend config (local)
└── package.json          # Frontend dependencies
```

---

## 🔧 Configuration Files

### Frontend `.env` (Project Root)
```env
VITE_API_URL=http://localhost:8000
```

### Backend `.env` (backend/.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_attendance
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🗄️ Database Setup

If you need to reset the database:

```bash
cd backend
source venv/bin/activate

# Drop and recreate
dropdb campus_attendance
createdb campus_attendance

# Run migrations
alembic upgrade head
```

---

## 🧪 Testing

### Test Backend API
```bash
# Check health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

### Test Frontend
1. Register a new user
2. Login
3. Click "Check In" on Dashboard
4. Go to "Attendance History"
5. View your record

---

## 🛠️ Common Issues

### Issue: Backend won't start
**Solution**: 
```bash
# Check if PostgreSQL is running
psql postgres -c "SELECT version();"

# Check if port 8000 is free
lsof -i :8000
```

### Issue: Frontend won't start
**Solution**: 
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Can't connect to database
**Solution**: 
Edit `backend/.env` and update:
```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/campus_attendance
```

### Issue: CORS errors in browser
**Solution**: 
Make sure backend is running and check `backend/.env`:
```env
CORS_ORIGINS=http://localhost:5173
```

---

## 📝 Default Database Credentials

Update these in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_attendance
```

Change `postgres` and `password` to match your local PostgreSQL setup.

---

## 🎯 What Works

✅ **Authentication** (JWT tokens, no cloud)
- Register new users
- Login with username/password
- Logout
- Protected routes

✅ **Attendance Tracking**
- Check-in
- Check-out
- View history
- Real-time updates (10 second polling)

✅ **Dashboard**
- Live statistics
- Activity feed
- User status

✅ **Attendance History**
- Date filtering
- Search
- Duration calculation

---

## 🔐 No Cloud Dependencies

- ❌ No Supabase
- ❌ No AWS
- ❌ No external APIs
- ✅ 100% Local PostgreSQL
- ✅ Local backend (FastAPI)
- ✅ Local frontend (React + Vite)

---

## 📚 API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🚦 Server Status

### Backend (Port 8000)
```bash
# Check if running
curl http://localhost:8000/health

# Should return:
{"status":"healthy","timestamp":"..."}
```

### Frontend (Port 5173)
```bash
# Open in browser
open http://localhost:5173
```

---

## 🎓 Next Steps

1. ✅ Get it running locally (you're here!)
2. Create test users
3. Test check-in/check-out
4. Explore attendance history
5. Week 3: Add WebSocket for real-time updates

---

## 💡 Development Tips

### Auto-reload Backend
Backend auto-reloads when you change Python files (uvicorn reload enabled).

### Auto-reload Frontend
Frontend auto-reloads when you change React files (Vite HMR).

### View Backend Logs
Backend logs show in the terminal where you ran `python main.py`.

### View Frontend Logs
Frontend logs show in browser console (F12 → Console).

---

## 🔄 Restart Everything

If something goes wrong:

```bash
# Stop all (Ctrl+C in each terminal)

# Backend
cd backend
source venv/bin/activate
python main.py

# Frontend (new terminal)
npm run dev
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL running
- [ ] Database `campus_attendance` created
- [ ] Backend dependencies installed
- [ ] Backend running on port 8000
- [ ] Frontend dependencies installed
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can register new user
- [ ] Can login
- [ ] Can check-in/check-out

---

**All set! No cloud, no external dependencies, 100% local! 🎉**
