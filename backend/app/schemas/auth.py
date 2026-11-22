from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must contain at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = Field("HR_ANALYST", description="HR_ADMIN, HR_ANALYST, or AUDITOR")

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
