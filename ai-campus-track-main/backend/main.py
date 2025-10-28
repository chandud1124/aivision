from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uvicorn
import logging
from contextlib import asynccontextmanager

# Import services and models
from services.auth_service import AuthService, UserRole, Permission
from models.database_models import Base, User, AttendanceRecord, Camera, RFIDCard
from config.database import engine, get_db
from config.settings import Settings

# Optional imports
try:
    from services.face_recognition_service import FaceRecognitionService
    FACE_SERVICE_AVAILABLE = True
except ImportError as e:
    FACE_SERVICE_AVAILABLE = False
    logger.warning(f"Face recognition service not available: {e}")

try:
    from services.rfid_service import RFIDService
    RFID_SERVICE_AVAILABLE = True
except ImportError as e:
    RFID_SERVICE_AVAILABLE = False
    logger.warning(f"RFID service not available: {e}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize settings
settings = Settings()

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for app startup and shutdown"""
    logger.info("Starting AI Campus Attendance Tracker API")
    yield
    logger.info("Shutting down API")

# Initialize FastAPI app
app = FastAPI(
    title="AI Campus Attendance Tracker API",
    description="Advanced attendance system with AI face recognition and RFID integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
auth_service = AuthService({
    'jwt_secret_key': settings.JWT_SECRET_KEY,
    'jwt_algorithm': settings.JWT_ALGORITHM,
    'access_token_expire_minutes': settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    'refresh_token_expire_days': settings.REFRESH_TOKEN_EXPIRE_DAYS
})

# Initialize face service if available
face_service = None
if FACE_SERVICE_AVAILABLE:
    try:
        face_service = FaceRecognitionService({
            'face_detection_confidence': settings.FACE_DETECTION_CONFIDENCE,
            'face_recognition_tolerance': settings.FACE_RECOGNITION_TOLERANCE,
            'face_model': settings.FACE_MODEL,
            'encoding_model': settings.FACE_ENCODING_MODEL
        })
    except Exception as e:
        logger.error(f"Failed to initialize face service: {e}")
        face_service = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/v1/auth/register", status_code=status.HTTP_201_CREATED)
async def register(
    email: str,
    username: str,
    password: str,
    full_name: str,
    role: UserRole,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    try:
        # Check if user exists
        existing_user = db.query(User).filter(
            (User.email == email) | (User.username == username)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email or username already exists"
            )
        
        # Validate password
        password_validation = auth_service.validate_password_strength(password)
        if not password_validation['valid']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=password_validation['message']
            )
        
        # Create new user
        hashed_password = auth_service.hash_password(password)
        new_user = User(
            email=email,
            username=username,
            password_hash=hashed_password,
            full_name=full_name,
            role=role,
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"New user registered: {username} ({email})")
        
        return {
            "message": "User registered successfully",
            "user_id": new_user.id,
            "username": new_user.username
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@app.post("/api/v1/auth/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """User login"""
    try:
        # Find user
        user = db.query(User).filter(User.username == form_data.username).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Verify password
        if not auth_service.verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Check if account is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Generate tokens
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value
        }
        tokens = auth_service.generate_token_pair(token_data)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        logger.info(f"User logged in: {user.username}")
        
        return {
            **tokens,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/api/v1/users")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db)
):
    """Get all users with optional filtering"""
    try:
        query = db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        users = query.offset(skip).limit(limit).all()
        
        return {
            "total": query.count(),
            "users": [
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "full_name": u.full_name,
                    "role": u.role.value,
                    "is_active": u.is_active,
                    "department": u.department,
                    "created_at": u.created_at.isoformat()
                }
                for u in users
            ]
        }
    
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )


@app.get("/api/v1/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "department": user.department,
        "phone": user.phone,
        "created_at": user.created_at.isoformat(),
        "last_login": user.last_login.isoformat() if user.last_login else None
    }


# ============================================================================
# FACE RECOGNITION ENDPOINTS
# ============================================================================

@app.post("/api/v1/face/enroll")
async def enroll_face(
    user_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Enroll user face for recognition"""
    # Check if face service is available
    if not face_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Face recognition service not available. Install AI dependencies with: pip install -r requirements-ai.txt"
        )
    
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Read and process image
        import cv2
        import numpy as np
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Detect and encode face
        faces_data = face_service.detect_and_encode_faces(img)
        
        if not faces_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No face detected in image"
            )
        
        if len(faces_data) > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Multiple faces detected. Please provide image with single face"
            )
        
        # Save face encoding
        import json
        face_data = faces_data[0]
        encoding_json = json.dumps(face_data['encoding'])
        
        from models.database_models import FaceEncoding
        face_encoding = FaceEncoding(
            user_id=user_id,
            encoding_data=encoding_json,
            is_primary=True,
            created_at=datetime.utcnow()
        )
        
        db.add(face_encoding)
        db.commit()
        
        logger.info(f"Face enrolled for user: {user.username}")
        
        return {
            "message": "Face enrolled successfully",
            "user_id": user_id,
            "encoding_id": face_encoding.id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face enrollment error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enroll face"
        )


@app.post("/api/v1/face/verify")
async def verify_face(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Verify face against enrolled faces"""
    # Check if face service is available
    if not face_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Face recognition service not available. Install AI dependencies with: pip install -r requirements-ai.txt"
        )
    
    try:
        # Read and process image
        import cv2
        import numpy as np
        import json
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Detect face in image
        faces_data = face_service.detect_and_encode_faces(img)
        
        if not faces_data:
            return {
                "verified": False,
                "message": "No face detected"
            }
        
        face_encoding = np.array(faces_data[0]['encoding'])
        
        # Load all enrolled faces
        from models.database_models import FaceEncoding
        enrolled_faces = db.query(FaceEncoding).all()
        
        known_encodings = []
        for ef in enrolled_faces:
            encoding = np.array(json.loads(ef.encoding_data))
            known_encodings.append((ef.user_id, encoding))
        
        # Match face
        match_result = face_service.match_face_against_database(
            face_encoding,
            known_encodings
        )
        
        if match_result:
            user_id, confidence = match_result
            user = db.query(User).filter(User.id == user_id).first()
            
            return {
                "verified": True,
                "user_id": user_id,
                "username": user.username,
                "full_name": user.full_name,
                "confidence": float(confidence)
            }
        else:
            return {
                "verified": False,
                "message": "Face not recognized"
            }
    
    except Exception as e:
        logger.error(f"Face verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Face verification failed"
        )


# ============================================================================
# ATTENDANCE ENDPOINTS
# ============================================================================

@app.post("/api/v1/attendance/check-in")
async def check_in(
    user_id: int,
    verification_method: str,
    camera_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Mark attendance check-in"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if already checked in today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.user_id == user_id,
            AttendanceRecord.check_in_time >= today_start,
            AttendanceRecord.check_out_time == None
        ).first()
        
        if existing_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already checked in"
            )
        
        # Create attendance record
        from models.database_models import VerificationMethod, AttendanceStatus
        attendance = AttendanceRecord(
            user_id=user_id,
            camera_id=camera_id,
            check_in_time=datetime.utcnow(),
            verification_method=VerificationMethod(verification_method),
            status=AttendanceStatus.PRESENT,
            created_at=datetime.utcnow()
        )
        
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        logger.info(f"Check-in recorded for user: {user.username}")
        
        return {
            "message": "Check-in successful",
            "attendance_id": attendance.id,
            "user_id": user_id,
            "check_in_time": attendance.check_in_time.isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Check-in error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Check-in failed"
        )


@app.post("/api/v1/attendance/check-out")
async def check_out(user_id: int, db: Session = Depends(get_db)):
    """Mark attendance check-out"""
    try:
        # Find today's check-in record
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        attendance = db.query(AttendanceRecord).filter(
            AttendanceRecord.user_id == user_id,
            AttendanceRecord.check_in_time >= today_start,
            AttendanceRecord.check_out_time == None
        ).first()
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active check-in found"
            )
        
        # Update check-out time
        attendance.check_out_time = datetime.utcnow()
        duration = (attendance.check_out_time - attendance.check_in_time).total_seconds() / 60
        attendance.duration_minutes = int(duration)
        
        db.commit()
        
        logger.info(f"Check-out recorded for user ID: {user_id}")
        
        return {
            "message": "Check-out successful",
            "attendance_id": attendance.id,
            "check_out_time": attendance.check_out_time.isoformat(),
            "duration_minutes": attendance.duration_minutes
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Check-out error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Check-out failed"
        )


@app.get("/api/v1/attendance/records")
async def get_attendance_records(
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get attendance records with filtering"""
    try:
        query = db.query(AttendanceRecord)
        
        if user_id:
            query = query.filter(AttendanceRecord.user_id == user_id)
        
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(AttendanceRecord.check_in_time >= start_dt)
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(AttendanceRecord.check_in_time <= end_dt)
        
        total = query.count()
        records = query.offset(skip).limit(limit).all()
        
        return {
            "total": total,
            "records": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "check_in_time": r.check_in_time.isoformat(),
                    "check_out_time": r.check_out_time.isoformat() if r.check_out_time else None,
                    "status": r.status.value,
                    "verification_method": r.verification_method.value,
                    "duration_minutes": r.duration_minutes
                }
                for r in records
            ]
        }
    
    except Exception as e:
        logger.error(f"Error fetching attendance records: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch attendance records"
        )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Campus Attendance Tracker API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
        log_level="info"
    )
