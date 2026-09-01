"""
Pydantic schemas for authentication requests and responses.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class LoginRequest(BaseModel):
    user_code: str = Field(..., json_schema_extra={"example": "ADMIN001"}, description="User ID / User Code")
    password: str = Field(..., json_schema_extra={"example": "Admin@12345"}, description="Account Password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserAuthInfo(BaseModel):
    id: UUID
    user_code: str
    full_name: str
    department: str | None = None
    designation: str | None = None
    role: str
    team_id: UUID
    is_active: bool
    password_expiry_days: int
    password_expires_at: datetime
    must_change_password: bool
    days_until_expiry: int
    last_login_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    user: UserAuthInfo
    access_token: str
    password_expired: bool
    must_change_password: bool
    days_until_expiry: int
    message: str = "Login successful"


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Current Password")
    new_password: str = Field(..., min_length=8, description="New Password")
    confirm_password: str = Field(..., min_length=8, description="Confirm New Password")
