from datetime import datetime, timezone
from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.user_session import UserSession
from app.auth.security import SESSION_COOKIE_NAME, CSRF_COOKIE_NAME

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Extracts and verifies session token from HttpOnly cookie or Authorization Bearer header.
    Validates session expiration, CSRF for state-changing cookie requests, and user active status.
    """
    token: Optional[str] = None
    from_cookie = False

    # 1. Check HttpOnly session cookie
    if SESSION_COOKIE_NAME in request.cookies:
        token = request.cookies[SESSION_COOKIE_NAME]
        from_cookie = True
    # 2. Check Authorization Bearer header (for automated testing or direct API clients)
    elif "Authorization" in request.headers:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )

    # 3. Lookup session in database
    session_record = db.query(UserSession).filter(UserSession.session_token == token).first()
    if not session_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again."
        )

    # Check expiration
    now = datetime.now(timezone.utc)
    exp = session_record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now:
        db.delete(session_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again."
        )

    # 4. CSRF check for state-changing cookie requests
    if from_cookie and request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        csrf_header = request.headers.get("X-CSRF-Token") or request.headers.get("x-csrf-token")
        # Allow requests if header matches stored token or csrf cookie
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
        if not csrf_header or (csrf_header != session_record.csrf_token and csrf_header != csrf_cookie):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security validation failed: Invalid or missing CSRF token."
            )

    # 5. Lookup User
    user = db.query(User).filter(User.id == session_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated or no longer exists."
        )

    return user

def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Retrieves authenticated user if available, otherwise returns None without error."""
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None
