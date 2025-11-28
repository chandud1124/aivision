@echo off
echo ============================================
echo  AI Campus Attendance Tracker - Local Startup
echo ============================================
echo.

REM Check if Docker is running and start database
echo Checking Docker and starting database...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting PostgreSQL database with Docker...
    docker-compose -f docker-compose.dev.yml up -d postgres
    if %errorlevel% neq 0 (
        echo WARNING: Failed to start Docker database.
        echo Make sure Docker Desktop is running.
        echo.
    ) else (
        echo Database started successfully!
        timeout /t 5 /nobreak >nul
    )
) else (
    echo WARNING: Docker not found. Please ensure PostgreSQL is running manually.
    echo.
)

REM Run database migrations
echo Running database migrations...
cd server
if exist "scripts\migrate.js" (
    node scripts\migrate.js
    if %errorlevel% neq 0 (
        echo ERROR: Database migration failed!
        cd ..
        pause
        exit /b 1
    )
) else (
    echo WARNING: Migration script not found. Skipping migrations.
)
cd ..

echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd server && set PORT=8001 && node index.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting frontend development server...
start "Frontend Dev Server" cmd /k "set VITE_API_URL=http://localhost:8001 && npm run dev"

echo.
echo ============================================
echo  Servers Starting...
echo ============================================
echo.
echo Backend API:    http://localhost:8001
echo Frontend App:   http://localhost:8000
echo.
echo Login Credentials:
echo Username: admin@campus.edu
echo Password: Admin@123456
echo.
echo Press any key to stop all servers...
pause >nul

echo.
echo Stopping servers...
taskkill /fi "WINDOWTITLE eq Backend Server*" /t /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Frontend Dev Server*" /t /f >nul 2>&1

echo Stopping database...
docker-compose -f docker-compose.dev.yml down >nul 2>&1

echo.
echo All services stopped. Goodbye!
pause