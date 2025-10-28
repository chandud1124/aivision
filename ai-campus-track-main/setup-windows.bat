@echo off
echo ============================================
echo  AI Campus Attendance Tracker - Windows Setup
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo Recommended: LTS version
    pause
    exit /b 1
)

REM Check if Docker is installed (optional)
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker is not installed.
    echo Docker is recommended for database setup.
    echo Download from: https://www.docker.com/products/docker-desktop
    echo.
)

echo Node.js version:
node --version
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)

echo.
echo Frontend dependencies installed successfully!
echo.

REM Setup backend
echo Setting up backend...
if not exist "server" (
    echo ERROR: Server directory not found!
    pause
    exit /b 1
)

cd server

REM Check if Python is available for backend (if needed)
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Python not found. Backend may require Python for some features.
)

REM Install backend dependencies if package.json exists
if exist "package.json" (
    echo Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies!
        cd ..
        pause
        exit /b 1
    )
)

cd ..

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Start PostgreSQL database (see README for Docker setup)
echo 2. Run database migrations: cd server && npm run migrate
echo 3. Start the backend: npm run dev:server
echo 4. Start the frontend: npm run dev
echo.
echo Or use the automated startup script: start-local.bat
echo.
pause