from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = os.getenv("APP_NAME", "AI Campus Attendance Tracker")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    API_VERSION: str = os.getenv("API_VERSION", "v1")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/campus_attendance")
    DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", 20))
    DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", 10))
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_CACHE_TTL: int = int(os.getenv("REDIS_CACHE_TTL", 3600))
    
    # JWT & Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
    
    # Password Settings
    PASSWORD_MIN_LENGTH: int = int(os.getenv("PASSWORD_MIN_LENGTH", 8))
    PASSWORD_BCRYPT_ROUNDS: int = int(os.getenv("PASSWORD_BCRYPT_ROUNDS", 12))
    
    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    CORS_CREDENTIALS: bool = os.getenv("CORS_CREDENTIALS", "true").lower() == "true"
    
    # AI Face Recognition
    FACE_DETECTION_CONFIDENCE: float = float(os.getenv("FACE_DETECTION_CONFIDENCE", 0.7))
    FACE_RECOGNITION_TOLERANCE: float = float(os.getenv("FACE_RECOGNITION_TOLERANCE", 0.6))
    FACE_MODEL: str = os.getenv("FACE_MODEL", "hog")
    FACE_ENCODING_MODEL: str = os.getenv("FACE_ENCODING_MODEL", "large")
    MAX_FACE_DISTANCE: float = float(os.getenv("MAX_FACE_DISTANCE", 0.6))
    
    # Camera Settings
    CAMERA_FRAME_RATE: int = int(os.getenv("CAMERA_FRAME_RATE", 30))
    CAMERA_RESOLUTION_WIDTH: int = int(os.getenv("CAMERA_RESOLUTION_WIDTH", 1280))
    CAMERA_RESOLUTION_HEIGHT: int = int(os.getenv("CAMERA_RESOLUTION_HEIGHT", 720))
    STREAM_QUALITY: str = os.getenv("STREAM_QUALITY", "high")
    
    # RFID Settings
    RFID_PORT: str = os.getenv("RFID_PORT", "/dev/ttyUSB0")
    RFID_BAUDRATE: int = int(os.getenv("RFID_BAUDRATE", 9600))
    RFID_TIMEOUT: int = int(os.getenv("RFID_TIMEOUT", 1))
    
    # Email Configuration
    SENDGRID_API_KEY: Optional[str] = os.getenv("SENDGRID_API_KEY")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@campus-attendance.com")
    FROM_NAME: str = os.getenv("FROM_NAME", "Campus Attendance System")
    
    # Notification Settings
    ENABLE_EMAIL_NOTIFICATIONS: bool = os.getenv("ENABLE_EMAIL_NOTIFICATIONS", "true").lower() == "true"
    ENABLE_SMS_NOTIFICATIONS: bool = os.getenv("ENABLE_SMS_NOTIFICATIONS", "false").lower() == "true"
    ENABLE_PUSH_NOTIFICATIONS: bool = os.getenv("ENABLE_PUSH_NOTIFICATIONS", "true").lower() == "true"
    
    # File Upload
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 10485760))
    ALLOWED_IMAGE_TYPES: str = os.getenv("ALLOWED_IMAGE_TYPES", "jpg,jpeg,png")
    ALLOWED_DOCUMENT_TYPES: str = os.getenv("ALLOWED_DOCUMENT_TYPES", "pdf,docx,xlsx,csv")
    
    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/app.log")
    
    # Session
    SESSION_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_TIMEOUT_MINUTES", 60))
    MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", 5))
    LOCKOUT_DURATION_MINUTES: int = int(os.getenv("LOCKOUT_DURATION_MINUTES", 30))
    
    # Attendance
    AUTO_CHECKOUT_HOURS: int = int(os.getenv("AUTO_CHECKOUT_HOURS", 12))
    LATE_ARRIVAL_THRESHOLD_MINUTES: int = int(os.getenv("LATE_ARRIVAL_THRESHOLD_MINUTES", 15))
    EARLY_DEPARTURE_THRESHOLD_MINUTES: int = int(os.getenv("EARLY_DEPARTURE_THRESHOLD_MINUTES", 15))
    
    # Supabase
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
