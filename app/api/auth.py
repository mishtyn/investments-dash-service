import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.database import get_db
from app.models.user import User
from app.models.login_token import LoginToken
from app.schemas.auth import TelegramAuthData, UserResponse, AuthResponse
from app.config import settings

router = APIRouter()

# JWT Configuration
SECRET_KEY = getattr(settings, 'secret_key', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def verify_telegram_auth(auth_data: TelegramAuthData, bot_token: str) -> bool:
    """Verify Telegram authentication data."""
    data_check_string = "\n".join([
        f"{k}={v}" 
        for k, v in sorted(auth_data.model_dump(exclude={'hash'}).items()) 
        if v is not None
    ])
    
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    data_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    # Check if hash matches and auth is not too old (24 hours)
    is_valid_hash = hmac.compare_digest(data_hash, auth_data.hash)
    is_recent = (datetime.now().timestamp() - auth_data.auth_date) < 86400
    
    return is_valid_hash and is_recent


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/telegram", response_model=AuthResponse)
def authenticate_telegram(
    auth_data: TelegramAuthData,
    db: Session = Depends(get_db)
):
    """Authenticate user via Telegram."""
    # Get bot token from settings
    bot_token = getattr(settings, 'telegram_bot_token', None)
    
    # For development, skip verification if bot token is not set
    if bot_token:
        if not verify_telegram_auth(auth_data, bot_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication data"
            )
    
    # Find or create user
    user = db.query(User).filter(User.telegram_id == auth_data.id).first()
    
    if not user:
        user = User(
            telegram_id=auth_data.id,
            username=auth_data.username,
            first_name=auth_data.first_name,
            last_name=auth_data.last_name,
            photo_url=auth_data.photo_url,
            last_login=datetime.now()
        )
        db.add(user)
    else:
        # Update user info
        user.username = auth_data.username
        user.first_name = auth_data.first_name
        user.last_name = auth_data.last_name
        user.photo_url = auth_data.photo_url
        user.last_login = datetime.now()
    
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.telegram_id), "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user(
    token: str,
    db: Session = Depends(get_db)
):
    """Get current user info from token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        telegram_id: int = int(payload.get("sub"))
        if telegram_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/verify")
def verify_token(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Verify login token from Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    # Find token in database
    login_token = db.query(LoginToken).filter(LoginToken.token == token).first()
    
    if not login_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # Check if token is expired
    if login_token.expires_at < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    
    # Check if token was already used
    if login_token.is_used:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token already used"
        )
    
    # Mark token as used
    login_token.is_used = True
    login_token.used_at = datetime.now()
    db.commit()
    
    # Get user
    user = db.query(User).filter(User.id == login_token.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create a new JWT token for session
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.telegram_id), "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "valid": True,
        "user": UserResponse.model_validate(user),
        "access_token": access_token
    }

