import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import HTTPException, Response, Request

# Password Hasher using Argon2id
ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=1,
    hash_len=32
)

SESSION_COOKIE_NAME = "idrestore_session"
CSRF_COOKIE_NAME = "idrestore_csrf"
SESSION_DURATION_DAYS = 7

# In-memory sliding window rate limiter for auth attempts: ip -> [timestamp, ...]
_rate_limit_records = defaultdict(list)
MAX_AUTH_ATTEMPTS_PER_MINUTE = 15

def check_rate_limit(request: Request):
    """Enforces rate limiting on authentication attempts by client IP."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    # Retain records within the last 60 seconds
    _rate_limit_records[client_ip] = [
        t for t in _rate_limit_records[client_ip] if now - t < 60
    ]
    if len(_rate_limit_records[client_ip]) >= MAX_AUTH_ATTEMPTS_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Too many authentication attempts. Please wait 60 seconds before retrying."
        )
    _rate_limit_records[client_ip].append(now)

def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    return ph.hash(password)

def verify_password(hashed_password: str, plain_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def generate_tokens() -> Tuple[str, str]:
    """Generates cryptographically secure session and CSRF tokens."""
    session_token = secrets.token_urlsafe(32)
    csrf_token = secrets.token_urlsafe(24)
    return session_token, csrf_token

def set_auth_cookies(
    response: Response,
    session_token: str,
    csrf_token: str,
    is_https: bool = False
):
    """
    Sets secure HttpOnly session cookie and accessible CSRF cookie.
    Obsidian Futurism security standard: SameSite=Lax, HttpOnly for session.
    """
    max_age = SESSION_DURATION_DAYS * 86400

    # Session token: HttpOnly, restricted from JavaScript access
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        max_age=max_age,
        expires=max_age,
        path="/",
        httponly=True,
        secure=is_https,
        samesite="lax"
    )

    # CSRF token: Non-HttpOnly so client-side JavaScript can read and mirror in X-CSRF-Token header
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        max_age=max_age,
        expires=max_age,
        path="/",
        httponly=False,
        secure=is_https,
        samesite="lax"
    )

def clear_auth_cookies(response: Response):
    """Clears authentication cookies upon logout."""
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(key=CSRF_COOKIE_NAME, path="/")
