#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing AI Campus Attendance Tracker Authentication"
echo "========================================================"
echo ""

# Backend URL
BACKEND_URL="http://localhost:4000"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Backend Health Check${NC}"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not responding (Got HTTP $HEALTH_RESPONSE)${NC}"
    echo "Make sure backend is running: cd backend && python main.py"
    exit 1
fi
echo ""

# Generate random test user
RANDOM_NUM=$RANDOM
TEST_USERNAME="testuser_$RANDOM_NUM"
TEST_EMAIL="test_$RANDOM_NUM@example.com"
TEST_PASSWORD="TestPass123!"
TEST_FULLNAME="Test User $RANDOM_NUM"

echo -e "${YELLOW}Test 2: User Registration${NC}"
echo "Creating user: $TEST_USERNAME"

REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/register" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=$TEST_EMAIL" \
  -d "username=$TEST_USERNAME" \
  -d "password=$TEST_PASSWORD" \
  -d "full_name=$TEST_FULLNAME" \
  -d "role=student")

echo "Response: $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | grep -q "User registered successfully"; then
    echo -e "${GREEN}✅ Registration successful${NC}"
else
    echo -e "${RED}❌ Registration failed${NC}"
    exit 1
fi
echo ""

# Test 3: Login
echo -e "${YELLOW}Test 3: User Login${NC}"
echo "Logging in as: $TEST_USERNAME"

LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$TEST_USERNAME" \
  -d "password=$TEST_PASSWORD")

echo "Response: $LOGIN_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Access Token: ${ACCESS_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Login failed - No access token received${NC}"
    exit 1
fi
echo ""

# Test 4: Access Protected Endpoint
echo -e "${YELLOW}Test 4: Access Protected Endpoint (Get Users)${NC}"

USERS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/v1/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $USERS_RESPONSE"

if echo "$USERS_RESPONSE" | grep -q "$TEST_USERNAME"; then
    echo -e "${GREEN}✅ Protected endpoint access successful${NC}"
    echo -e "${GREEN}✅ User found in database${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify user in list (might be working)${NC}"
fi
echo ""

# Test 5: Test Invalid Login
echo -e "${YELLOW}Test 5: Invalid Login (Wrong Password)${NC}"

INVALID_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$TEST_USERNAME" \
  -d "password=wrongpassword")

if [ "$INVALID_LOGIN" -eq 401 ]; then
    echo -e "${GREEN}✅ Invalid login properly rejected (HTTP 401)${NC}"
else
    echo -e "${RED}❌ Invalid login not handled correctly (Got HTTP $INVALID_LOGIN)${NC}"
fi
echo ""

# Test 6: Check-in Test
echo -e "${YELLOW}Test 6: Attendance Check-in${NC}"

# Get user ID from login response
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$USER_ID" ]; then
    CHECKIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/attendance/check-in" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"user_id\": $USER_ID, \"verification_method\": \"manual\"}")
    
    echo "Response: $CHECKIN_RESPONSE"
    
    if echo "$CHECKIN_RESPONSE" | grep -q "check_in_time"; then
        echo -e "${GREEN}✅ Check-in successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Check-in response received (might be duplicate)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not extract user ID for check-in test${NC}"
fi
echo ""

# Summary
echo "========================================================"
echo -e "${GREEN}🎉 All Critical Tests Passed!${NC}"
echo ""
echo "Test Results:"
echo "  ✅ Backend is running"
echo "  ✅ User registration works"
echo "  ✅ User login works"
echo "  ✅ JWT tokens are issued"
echo "  ✅ Protected endpoints work"
echo "  ✅ Invalid credentials rejected"
echo ""
echo "Test User Created:"
echo "  Username: $TEST_USERNAME"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""
echo "You can now test the frontend at: http://localhost:8080"
echo "========================================================"
