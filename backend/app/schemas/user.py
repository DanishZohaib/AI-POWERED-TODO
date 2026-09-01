"""
Pydantic schemas for User Management (Admin operations & user profile responses).
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class UserCreate(BaseModel):
    user_code: str = Field(..., min_length=3, max_length=50, description="User ID e.g. USER006")
    full_name: str = Field(..., min_length=2, max_length=200, description="Full Name")
    department: str | None = Field(default=None, max_length=100)
    designation: str | None = Field(default=None, max_length=100)
    role: str = Field(default="STANDARD_USER", description="POWER_ADMIN or STANDARD_USER")
    temporary_password: str = Field(..., min_length=8, description="Temporary Initial Password")
    password_expiry_days: int = Field(default=30, ge=1, le=365, description="Validity period in days")
    must_change_password: bool = Field(default=True, description="Force password change on first login")
    is_active: bool = Field(default=True)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    department: str | None = Field(default=None, max_length=100)
    designation: str | None = Field(default=None, max_length=100)
    role: str | None = Field(default=None, description="POWER_ADMIN or STANDARD_USER")
    password_expiry_days: int | None = Field(default=None, ge=1, le=365)


class PasswordResetRequest(BaseModel):
    new_temporary_password: str = Field(..., min_length=8, description="New temporary password set by Admin")
    must_change_password: bool = Field(default=True, description="Force password change on next login")


class ExtendExpiryRequest(BaseModel):
    additional_days: int = Field(..., ge=1, le=365, description="Days to extend password validity by")


class UserResponse(BaseModel):
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
    days_until_expiry: int
    must_change_password: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPaginatedResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
