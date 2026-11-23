import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

ALLOWED_SELF_REGISTER_ROLES = {"HR_ANALYST"}
PRIVILEGED_ROLES = {"HR_ADMIN", "AUDITOR"}

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Password meeting security policy")
    full_name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = Field("HR_ANALYST", description="Organizational role (standard self-registration is HR_ANALYST)")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not cleaned or "@" not in cleaned:
            raise ValueError("Please enter a valid corporate email address.")
        return cleaned

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full legal name must contain at least 2 characters.")
        if len(cleaned) > 100:
            raise ValueError("Full name cannot exceed 100 characters.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_policy(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must contain at least 8 characters.")
        if len(v) > 128:
            raise ValueError("Password cannot exceed 128 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z).")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter (a-z).")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one numerical digit (0-9).")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+[\]\\/`~]", v):
            raise ValueError("Password must contain at least one special character (!@#$%^&* etc.).")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> str:
        role_val = (v or "HR_ANALYST").strip().upper()
        if role_val in PRIVILEGED_ROLES:
            raise ValueError("Privileged roles (HR_ADMIN, AUDITOR) cannot be self-assigned during registration. Please register as HR_ANALYST or contact an administrator.")
        if role_val not in ALLOWED_SELF_REGISTER_ROLES:
            raise ValueError(f"Invalid organizational role '{role_val}'. Allowed registration role is HR_ANALYST.")
        return role_val

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    user: UserResponse
    message: str
    csrf_token: str

class MessageResponse(BaseModel):
    message: str
    success: bool = True
