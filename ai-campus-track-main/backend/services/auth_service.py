from datetime import datetime, timedelta
from typing import Optional, Dict, List
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging
from functools import wraps
from enum import Enum

logger = logging.getLogger(__name__)

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    SECURITY = "security"

class Permission(str, Enum):
    # User permissions
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    
    # Attendance permissions
    ATTENDANCE_VIEW_ALL = "attendance:view_all"
    ATTENDANCE_VIEW_OWN = "attendance:view_own"
    ATTENDANCE_MARK = "attendance:mark"
    ATTENDANCE_EDIT = "attendance:edit"
    
    # Camera permissions
    CAMERA_MANAGE = "camera:manage"
    CAMERA_VIEW = "camera:view"
    
    # Report permissions
    REPORT_GENERATE = "report:generate"
    REPORT_VIEW = "report:view"
    
    # System permissions
    SYSTEM_SETTINGS = "system:settings"
    SYSTEM_LOGS = "system:logs"

# Role-based permission mapping
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE,
        Permission.ATTENDANCE_VIEW_ALL, Permission.ATTENDANCE_MARK, Permission.ATTENDANCE_EDIT,
        Permission.CAMERA_MANAGE, Permission.CAMERA_VIEW,
        Permission.REPORT_GENERATE, Permission.REPORT_VIEW,
        Permission.SYSTEM_SETTINGS, Permission.SYSTEM_LOGS
    ],
    UserRole.TEACHER: [
        Permission.USER_READ,
        Permission.ATTENDANCE_VIEW_ALL, Permission.ATTENDANCE_MARK,
        Permission.CAMERA_VIEW,
        Permission.REPORT_GENERATE, Permission.REPORT_VIEW
    ],
    UserRole.STUDENT: [
        Permission.ATTENDANCE_VIEW_OWN,
        Permission.REPORT_VIEW
    ],
    UserRole.SECURITY: [
        Permission.USER_READ,
        Permission.ATTENDANCE_VIEW_ALL, Permission.ATTENDANCE_MARK,
        Permission.CAMERA_VIEW
    ]
}

class AuthService:
    """Authentication and authorization service"""
    
    def __init__(self, config: Dict):
        self.secret_key = config.get('jwt_secret_key', 'default-secret-key')
        self.algorithm = config.get('jwt_algorithm', 'HS256')
        self.access_token_expire_minutes = int(config.get('access_token_expire_minutes', 30))
        self.refresh_token_expire_days = int(config.get('refresh_token_expire_days', 7))
        self.password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        logger.info("Auth Service initialized")
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        return self.password_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.password_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create JWT access token
        
        Args:
            data: Data to encode in token
            expires_delta: Optional custom expiration time
        
        Returns:
            Encoded JWT token
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict) -> str:
        """
        Create JWT refresh token
        
        Args:
            data: Data to encode in token
        
        Returns:
            Encoded JWT refresh token
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        })
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def decode_token(self, token: str) -> Optional[Dict]:
        """
        Decode and validate JWT token
        
        Args:
            token: JWT token to decode
        
        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError as e:
            logger.error(f"Token decode error: {e}")
            return None
    
    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict]:
        """
        Verify token validity and type
        
        Args:
            token: JWT token to verify
            token_type: Expected token type ('access' or 'refresh')
        
        Returns:
            Token payload if valid, None otherwise
        """
        payload = self.decode_token(token)
        
        if not payload:
            return None
        
        if payload.get("type") != token_type:
            logger.warning(f"Invalid token type. Expected {token_type}, got {payload.get('type')}")
            return None
        
        return payload
    
    def generate_token_pair(self, user_data: Dict) -> Dict[str, str]:
        """
        Generate both access and refresh tokens
        
        Args:
            user_data: User data to encode in tokens
        
        Returns:
            Dictionary with access_token and refresh_token
        """
        access_token = self.create_access_token(user_data)
        refresh_token = self.create_refresh_token({"sub": user_data.get("sub")})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    
    def has_permission(self, user_role: UserRole, required_permission: Permission) -> bool:
        """
        Check if user role has required permission
        
        Args:
            user_role: User's role
            required_permission: Required permission
        
        Returns:
            True if user has permission, False otherwise
        """
        role_perms = ROLE_PERMISSIONS.get(user_role, [])
        return required_permission in role_perms
    
    def get_user_permissions(self, user_role: UserRole) -> List[Permission]:
        """
        Get all permissions for a user role
        
        Args:
            user_role: User's role
        
        Returns:
            List of permissions
        """
        return ROLE_PERMISSIONS.get(user_role, [])
    
    def validate_password_strength(self, password: str) -> Dict[str, any]:
        """
        Validate password strength
        
        Args:
            password: Password to validate
        
        Returns:
            Dictionary with validation result and message
        """
        if len(password) < 8:
            return {"valid": False, "message": "Password must be at least 8 characters long"}
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        if not (has_upper and has_lower and has_digit):
            return {
                "valid": False,
                "message": "Password must contain uppercase, lowercase, and digit characters"
            }
        
        return {"valid": True, "message": "Password is strong"}


def require_auth(func):
    """Decorator to require authentication"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Implementation would extract and verify token from request
        return await func(*args, **kwargs)
    return wrapper


def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Implementation would check user permissions
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(allowed_roles: List[UserRole]):
    """Decorator to require specific role(s)"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Implementation would check user role
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class SessionManager:
    """Manage user sessions and login attempts"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.max_login_attempts = 5
        self.lockout_duration_minutes = 30
    
    def record_login_attempt(self, user_id: int, success: bool):
        """Record login attempt"""
        if not self.redis:
            return
        
        key = f"login_attempts:{user_id}"
        
        if success:
            self.redis.delete(key)
        else:
            attempts = self.redis.incr(key)
            self.redis.expire(key, self.lockout_duration_minutes * 60)
            
            if attempts >= self.max_login_attempts:
                self.lock_user_account(user_id)
    
    def lock_user_account(self, user_id: int):
        """Lock user account after too many failed attempts"""
        if not self.redis:
            return
        
        key = f"locked_user:{user_id}"
        self.redis.setex(key, self.lockout_duration_minutes * 60, "locked")
        logger.warning(f"User account {user_id} locked due to too many failed login attempts")
    
    def is_user_locked(self, user_id: int) -> bool:
        """Check if user account is locked"""
        if not self.redis:
            return False
        
        key = f"locked_user:{user_id}"
        return self.redis.exists(key) > 0
    
    def create_session(self, user_id: int, token: str):
        """Create user session"""
        if not self.redis:
            return
        
        key = f"session:{user_id}"
        self.redis.setex(key, 3600, token)  # 1 hour session
    
    def invalidate_session(self, user_id: int):
        """Invalidate user session"""
        if not self.redis:
            return
        
        key = f"session:{user_id}"
        self.redis.delete(key)
