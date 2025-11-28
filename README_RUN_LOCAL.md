# 🚀 Run Locally - No Cloud (Step by Step)

**All Supabase and cloud dependencies have been removed.** This runs 100% on your local machine.

---

## Option 1: With Docker (Easiest) ⭐

### Prerequisites
- Docker Desktop installed and **running**
- Node.js installed
- Python 3.8+ installed

### Steps

1. **Start Docker Desktop** (must be running!)

2. **Start PostgreSQL database:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Setup Backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   ```

4. **Start Backend:**
   ```bash
   # (Still in backend directory with venv activated)
   python main.py
   ```
   Backend runs on: **http://localhost:8000**

5. **In a NEW terminal, start Frontend:**
   ```bash
   cd /Users/chandu/Downloads/ai-campus-track-main
   npm install
   npm run dev
   ```
   Frontend runs on: **http://localhost:5173**

6. **Open browser:** http://localhost:5173

---

## Option 2: Without Docker (Manual PostgreSQL)

### Prerequisites
- PostgreSQL installed locally
- Node.js installed
- Python 3.8+ installed

### Steps

1. **Install PostgreSQL** (if not installed):
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Create Database:**
   ```bash
   createdb campus_attendance
   ```

3. **Update Backend Config:**
   Edit `backend/.env` and update database URL:
   ```env
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/campus_attendance
   ```

4. **Setup Backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   ```

5. **Start Backend:**
   ```bash
   python main.py
   ```

6. **In NEW terminal, start Frontend:**
   ```bash
   npm install
   npm run dev
   ```

---

## ✅ Verify It's Working

### Test Backend:
```bash
curl http://localhost:8000/health
```
Should return: `{"status":"healthy",...}`

### Test Frontend:
Open: http://localhost:5173
- Should see login page
- Register a new user
- Login
- See Dashboard

---

## 🎯 Quick Commands

### Stop PostgreSQL Container (Docker):
```bash
docker-compose -f docker-compose.dev.yml down
```

### Restart Backend:
```bash
cd backend
source venv/bin/activate
python main.py
```

### Restart Frontend:
```bash
npm run dev
```

### View Database (Docker):
```bash
docker exec -it campus_postgres psql -U postgres -d campus_attendance
```

---

## 📝 What's Configured

### Frontend (`.env`):
```env
VITE_API_URL=http://localhost:8000
```

### Backend (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/campus_attendance
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
CORS_ORIGINS=http://localhost:5173
```

---

## 🐛 Troubleshooting

### Backend won't start - "Port 8000 already in use"
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Frontend won't start - "Port 5173 already in use"
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Can't connect to database
```bash
# Check if PostgreSQL container is running
docker ps | grep campus_postgres

# Or check PostgreSQL service (if installed locally)
brew services list | grep postgresql
```

### CORS errors in browser
- Make sure backend is running on port 8000
- Check browser console for exact error
- Verify `backend/.env` has: `CORS_ORIGINS=http://localhost:5173`

---

## 🎉 Success Checklist

- [ ] PostgreSQL running (Docker or local)
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:5173
- [ ] Can register new user
- [ ] Can login
- [ ] Can check-in/check-out
- [ ] Can view attendance history

---

## 🔐 100% Local - No Cloud

✅ **What's Local:**
- PostgreSQL database (Docker or local)
- FastAPI backend (Python)
- React frontend (Node/Vite)
- JWT authentication (no Supabase!)
- All data stays on your machine

❌ **No Cloud Services:**
- No Supabase
- No AWS
- No external APIs
- No internet required (after initial npm install)

---

## 📚 Next Steps

1. Test Week 1 features (Auth)
2. Test Week 2 features (Attendance, Check-in/out, History)
3. Ready for Week 3 (WebSocket, Live Monitoring)

---

**Need help? Check LOCAL_SETUP.md for detailed guide!**
