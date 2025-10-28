#!/bin/bash

echo "🚀 Starting AI Campus Attendance Tracker - 100% Local"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Start PostgreSQL with Docker
echo -e "${BLUE}📦 Starting PostgreSQL container...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if venv exists
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}🐍 Creating Python virtual environment...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt
    cd ..
fi

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
cd backend
source venv/bin/activate
alembic upgrade head
cd ..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the servers, open 2 terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo -e "${BLUE}  cd backend && source venv/bin/activate && python main.py${NC}"
echo ""
echo "Terminal 2 (Frontend):"
echo -e "${BLUE}  npm run dev${NC}"
echo ""
echo "Then open: http://localhost:5173"
echo ""
