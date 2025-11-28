#!/bin/bash

# AI Campus Attendance Tracker - Quick Start Script
# This script helps you set up the system quickly

set -e

echo "🎓 AI Campus Attendance Tracker - Quick Start"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.9 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python 3 found${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}⚠️  PostgreSQL is not installed. Please install PostgreSQL 14 or higher.${NC}"
    echo "You can continue, but you'll need to set up PostgreSQL manually."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📦 Installing Dependencies..."
echo ""

# Backend setup
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip --quiet

# Install requirements
echo "Installing Python dependencies (this may take a few minutes)..."
pip install -r requirements.txt --quiet

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "Note: .env.example not found, using existing .env"
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"

# Frontend setup
cd ..
echo ""
echo -e "${BLUE}Setting up frontend...${NC}"

# Install npm dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install --silent
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

# Database setup
echo ""
echo -e "${BLUE}Setting up database...${NC}"

if command -v psql &> /dev/null; then
    echo "Creating PostgreSQL database..."
    # Try to create database (ignore error if it already exists)
    createdb campus_attendance 2>/dev/null && echo -e "${GREEN}✓ Database created${NC}" || echo -e "${GREEN}✓ Database already exists${NC}"
else
    echo -e "${RED}⚠️  Skipping database creation. Please create manually:${NC}"
    echo "   createdb campus_attendance"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "To start the application:"
echo ""
echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
echo "  npm run dev"
echo ""
echo "Access the application:"
echo "  Frontend:  http://localhost:5173"
echo "  API:       http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "For Docker deployment:"
echo "  docker-compose up -d"
echo ""
echo "📚 Documentation:"
echo "  - COMPLETE_SETUP_GUIDE.md"
echo "  - PROJECT_OVERVIEW.md"
echo "  - IMPLEMENTATION_COMPLETE.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
