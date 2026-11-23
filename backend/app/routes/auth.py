import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.user_session import UserSession
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse, AuthResponse, MessageResponse
from app.auth.security import (
    hash_password,
    verify_password,
    generate_tokens,
    set_auth_cookies,
    clear_auth_cookies,
    check_rate_limit,
    SESSION_COOKIE_NAME,
    SESSION_DURATION_DAYS
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

@router.post("/register", response_model=AuthResponse)
def register_user(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Registers a new standard HR analyst account.
    Hashes password using Argon2id, generates session, and sets secure HttpOnly cookies.
    Enforces security policy: prevents self-assignment of privileged roles (HR_ADMIN, AUDITOR).
    """
    check_rate_limit(request)
    normalized_email = payload.email.strip().lower()

    # Enforce role validation on backend (prevent privilege escalation)
    assigned_role = (payload.role or "HR_ANALYST").strip().upper()
    if assigned_role in {"HR_ADMIN", "AUDITOR"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Privileged roles (HR_ADMIN, AUDITOR) cannot be self-assigned during registration. Please register as HR_ANALYST or contact an administrator."
        )
    if assigned_role != "HR_ANALYST":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid organizational role '{assigned_role}'. Allowed self-registration role is HR_ANALYST."
        )

    # Check email uniqueness
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered. Please sign in or use a different email."
        )

    # Hash password with Argon2id (never logged)
    hashed = hash_password(payload.password)

    # Atomic transaction for user creation and initial session
    try:
        new_user = User(
            email=normalized_email,
            hashed_password=hashed,
            full_name=payload.full_name.strip(),
            role="HR_ANALYST",
            is_active=True
        )
        db.add(new_user)
        db.flush()

        # Create authenticated session
        session_token, csrf_token = generate_tokens()
        expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)

        session_record = UserSession(
            user_id=new_user.id,
            session_token=session_token,
            csrf_token=csrf_token,
            expires_at=expires_at,
            user_agent=(request.headers.get("user-agent") or "")[:255],
            ip_address=request.client.host if request.client else "127.0.0.1"
        )
        db.add(session_record)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration is temporarily unavailable. Please try again later."
        )

    # Set secure HttpOnly cookie + CSRF cookie
    is_https = request.url.scheme == "https"
    set_auth_cookies(response, session_token, csrf_token, is_https=is_https)

    return AuthResponse(
        user=UserResponse(**new_user.to_dict()),
        message="Account created and session initialized successfully.",
        csrf_token=csrf_token
    )

@router.post("/login", response_model=AuthResponse)
def login_user(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authenticates user credentials, verifies Argon2id hash, and issues session cookie.
    """
    check_rate_limit(request)
    normalized_email = payload.email.strip().lower()

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(user.hashed_password, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Verify your email and password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or deactivated. Contact your HRMS administrator."
        )

    # Issue new session
    session_token, csrf_token = generate_tokens()
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)

    session_record = UserSession(
        user_id=user.id,
        session_token=session_token,
        csrf_token=csrf_token,
        expires_at=expires_at,
        user_agent=(request.headers.get("user-agent") or "")[:255],
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(session_record)
    db.commit()

    is_https = request.url.scheme == "https"
    set_auth_cookies(response, session_token, csrf_token, is_https=is_https)

    return AuthResponse(
        user=UserResponse(**user.to_dict()),
        message="Authentication successful.",
        csrf_token=csrf_token
    )

@router.post("/logout", response_model=MessageResponse)
def logout_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Terminates the active session in the database and clears authentication cookies.
    """
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token and "Authorization" in request.headers:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if token:
        db.query(UserSession).filter(UserSession.session_token == token).delete()
        db.commit()

    clear_auth_cookies(response)
    return MessageResponse(message="Signed out successfully.", success=True)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Returns the authenticated user's profile and roles."""
    return UserResponse(**current_user.to_dict())

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password_request(
    request: Request
):
    """
    Informs user about the enterprise password recovery protocol.
    Prevents enumeration and directs users to enterprise HRMS administrator.
    """
    return MessageResponse(
        message="Password recovery request logged. In this local demonstration instance, password resets are managed via the administrative console or database seed.",
        success=True
    )
