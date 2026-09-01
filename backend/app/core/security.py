"""
Security utilities: password hashing (bcrypt) and JWT token management.
Direct bcrypt usage to avoid legacy passlib compatibility issues with modern Python & bcrypt.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


# ---------- Password Hashing ----------
def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    # Ensure password string is encoded as bytes, truncate at 72 bytes if needed per bcrypt spec
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash string."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


# ---------- JWT Token ----------
def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token with expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT access token. Returns None on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


# ---------- Password Validation ----------
def validate_password_strength(password: str) -> list[str]:
    """
    Validate password against policy.
    Returns a list of validation error messages (empty = valid).
    """
    errors: list[str] = []
    min_len = settings.MIN_PASSWORD_LENGTH

    if len(password) < min_len:
        errors.append(f"Password must be at least {min_len} characters long.")
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter.")
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter.")
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number.")

    return errors


def calculate_password_expiry(expiry_days: int) -> datetime:
    """Calculate password expiry datetime from now."""
    return datetime.now(timezone.utc) + timedelta(days=expiry_days)
