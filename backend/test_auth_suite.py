import sys
import os
import re
from datetime import datetime

# Set up paths
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import Request, Response, HTTPException
from pydantic import ValidationError
from starlette.datastructures import Headers, URL

from app.database.session import SessionLocal
from app.models.user import User
from app.models.user_session import UserSession
from app.schemas.auth import RegisterRequest, LoginRequest
from app.routes.auth import register_user, login_user, logout_user

def make_dummy_request(path="/api/auth", headers=None, cookies=None, client_host="127.0.0.1"):
    scope = {
        "type": "http",
        "method": "POST",
        "scheme": "http",
        "server": ("localhost", 8000),
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
        "client": (client_host, 12345),
        "app": None,
    }
    req = Request(scope)
    if cookies:
        req._cookies = cookies
    return req

def run_tests():
    db = SessionLocal()
    passed = 0
    total = 0

    print("=" * 60)
    print("IDRESTORE AI — AUTHENTICATION & REGISTRATION TEST SUITE")
    print("=" * 60)

    test_email = "synthetic_eval_analyst@idrestore.ai"
    test_password = "SecurePassword2026!"
    test_name = "Synthetic Evaluation User"

    # Pre-test cleanup if exists
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.query(UserSession).filter(UserSession.user_id == existing.id).delete()
        db.delete(existing)
        db.commit()

    # TEST 1: Password complexity validation (Pydantic schema)
    total += 1
    weak_passwords = [
        ("short", "Short1!"),
        ("no_upper", "alllower123!"),
        ("no_lower", "ALLUPPER123!"),
        ("no_digit", "NoDigitsHere!"),
        ("no_special", "NoSpecial1234"),
    ]
    all_weak_rejected = True
    for label, wp in weak_passwords:
        try:
            RegisterRequest(
                email=test_email,
                password=wp,
                full_name=test_name,
                role="HR_ANALYST"
            )
            all_weak_rejected = False
            print(f"[-] TEST 1 FAILED: Weak password '{wp}' was unexpectedly accepted.")
        except ValidationError:
            pass

    if all_weak_rejected:
        passed += 1
        print("[+] TEST 1 PASSED: Password complexity policy properly enforced (rejected 5 weak patterns).")

    # TEST 2: Email format validation
    total += 1
    invalid_emails = ["notanemail", "user@", "@domain.com", "user space@corp.com"]
    all_emails_rejected = True
    for em in invalid_emails:
        try:
            RegisterRequest(
                email=em,
                password=test_password,
                full_name=test_name,
                role="HR_ANALYST"
            )
            all_emails_rejected = False
            print(f"[-] TEST 2 FAILED: Invalid email '{em}' was unexpectedly accepted.")
        except ValidationError:
            pass

    if all_emails_rejected:
        passed += 1
        print("[+] TEST 2 PASSED: Email format validation properly enforced.")

    # TEST 3: Privileged role self-registration rejection
    total += 1
    privileged_roles = ["HR_ADMIN", "AUDITOR", "SUPERUSER"]
    all_priv_rejected = True
    for pr in privileged_roles:
        try:
            RegisterRequest(
                email=test_email,
                password=test_password,
                full_name=test_name,
                role=pr
            )
            all_priv_rejected = False
            print(f"[-] TEST 3 FAILED: Privileged role '{pr}' was unexpectedly accepted.")
        except ValidationError:
            pass

    if all_priv_rejected:
        passed += 1
        print("[+] TEST 3 PASSED: Privileged roles (HR_ADMIN, AUDITOR, etc.) strictly blocked from self-registration.")

    # TEST 4: Valid Registration
    total += 1
    reg_req = RegisterRequest(
        email=test_email,
        password=test_password,
        full_name=test_name,
        role="HR_ANALYST"
    )
    dummy_req = make_dummy_request(headers={"user-agent": "SyntheticTest/1.0"})
    dummy_resp = Response()

    try:
        auth_resp = register_user(reg_req, dummy_req, dummy_resp, db)
        assert auth_resp.user.email == test_email
        assert auth_resp.user.role == "HR_ANALYST"
        assert auth_resp.user.full_name == test_name
        assert "idrestore_session" in dummy_resp.headers.get("set-cookie", "")
        passed += 1
        print(f"[+] TEST 4 PASSED: Standard registration successful for '{test_email}' (Role: HR_ANALYST).")
    except Exception as e:
        print(f"[-] TEST 4 FAILED: Registration threw exception: {e}")

    # TEST 5: Database Persistence & Argon2id Verification
    total += 1
    db_user = db.query(User).filter(User.email == test_email).first()
    if db_user and db_user.hashed_password.startswith("$argon2id$"):
        # Check session table
        session = db.query(UserSession).filter(UserSession.user_id == db_user.id).first()
        if session:
            passed += 1
            print("[+] TEST 5 PASSED: Database persistence verified (Argon2id hash, session record in SQLite).")
        else:
            print("[-] TEST 5 FAILED: Session record missing from user_sessions table.")
    else:
        print("[-] TEST 5 FAILED: User not found or password not hashed with Argon2id.")

    # TEST 6: Duplicate Email Registration Rejection
    total += 1
    try:
        register_user(reg_req, dummy_req, Response(), db)
        print("[-] TEST 6 FAILED: Duplicate registration did not raise an error.")
    except HTTPException as http_err:
        if http_err.status_code == 400 and "already registered" in http_err.detail:
            passed += 1
            print(f"[+] TEST 6 PASSED: Duplicate registration returned 400 with message: '{http_err.detail}'.")
        else:
            print(f"[-] TEST 6 FAILED: Expected 400 with 'already registered', got {http_err.status_code}: {http_err.detail}")

    # TEST 7: Duplicate Email Case-Insensitive Rejection
    total += 1
    case_reg_req = RegisterRequest(
        email=test_email.upper(),
        password=test_password,
        full_name="Uppercase Variant",
        role="HR_ANALYST"
    )
    try:
        register_user(case_reg_req, dummy_req, Response(), db)
        print("[-] TEST 7 FAILED: Case-insensitive duplicate email was not blocked.")
    except HTTPException as http_err:
        if http_err.status_code == 400 and "already registered" in http_err.detail:
            passed += 1
            print("[+] TEST 7 PASSED: Case-insensitive email normalization blocked duplicate.")
        else:
            print(f"[-] TEST 7 FAILED: Expected 400 for uppercase duplicate, got {http_err.status_code}: {http_err.detail}")

    # TEST 8: Successful Login with Newly Created Credentials
    total += 1
    login_payload = LoginRequest(email=test_email, password=test_password)
    login_resp = Response()
    try:
        login_result = login_user(login_payload, dummy_req, login_resp, db)
        assert login_result.user.email == test_email
        assert "idrestore_session" in login_resp.headers.get("set-cookie", "")
        passed += 1
        print("[+] TEST 8 PASSED: Login with newly created user succeeded and session cookie issued.")
    except Exception as e:
        print(f"[-] TEST 8 FAILED: Login failed with error: {e}")

    # TEST 9: Invalid Password Login Rejection
    total += 1
    bad_login_payload = LoginRequest(email=test_email, password="WrongPassword123!")
    try:
        login_user(bad_login_payload, dummy_req, Response(), db)
        print("[-] TEST 9 FAILED: Invalid password did not raise HTTPException.")
    except HTTPException as http_err:
        if http_err.status_code == 401:
            passed += 1
            print(f"[+] TEST 9 PASSED: Invalid password returned 401 Unauthorized ('{http_err.detail}').")
        else:
            print(f"[-] TEST 9 FAILED: Expected 401, got {http_err.status_code}")

    # TEST 10: Logout and Session Termination
    total += 1
    # Extract session cookie from login
    cookie_str = login_resp.headers.get("set-cookie", "")
    session_token = None
    for cookie_part in cookie_str.split(";"):
        if "idrestore_session=" in cookie_part:
            session_token = cookie_part.split("idrestore_session=")[1].split(";")[0].strip()
            break

    if session_token:
        logout_req = make_dummy_request(cookies={"idrestore_session": session_token})
        logout_resp = Response()
        logout_res = logout_user(logout_req, logout_resp, db)
        # Check session is removed from DB
        session_still_exists = db.query(UserSession).filter(UserSession.session_token == session_token).first()
        if not session_still_exists:
            passed += 1
            print("[+] TEST 10 PASSED: Logout successfully terminated session in SQLite database.")
        else:
            print("[-] TEST 10 FAILED: Session was not removed from DB on logout.")
    else:
        print("[-] TEST 10 FAILED: Could not extract session token from login response.")

    # TEST 11: Protected Route Dependency Rejection Without Session
    total += 1
    from app.auth.dependencies import get_current_user
    no_cookie_req = make_dummy_request()
    try:
        get_current_user(no_cookie_req, db)
        print("[-] TEST 11 FAILED: get_current_user did not raise 401 when session cookie was missing.")
    except HTTPException as http_err:
        if http_err.status_code == 401:
            passed += 1
            print("[+] TEST 11 PASSED: Protected route access blocked without valid session (401 Unauthorized).")
        else:
            print(f"[-] TEST 11 FAILED: Expected 401, got {http_err.status_code}")

    # TEST 12: Backend Schema Isolation (Confirm Password Not Stored / Exposed)
    total += 1
    assert "confirm_password" not in RegisterRequest.model_fields, "confirm_password must not exist in RegisterRequest"
    assert "confirmPassword" not in RegisterRequest.model_fields, "confirmPassword must not exist in RegisterRequest"
    passed += 1
    print("[+] TEST 12 PASSED: Backend schema isolation verified (confirm_password is strictly client-side).")

    # TEST 13: Honest Recovery Status (No Fake Success When Email Delivery Unconfigured)
    total += 1
    from app.schemas.auth import ForgotPasswordRequest
    from app.routes.auth import forgot_password_request
    rec_payload = ForgotPasswordRequest(email="recovery_test@idrestore.ai")
    rec_result = forgot_password_request(rec_payload, dummy_req, db)
    assert rec_result.email_delivery_configured is False, "SMTP must report unconfigured in local env"
    assert "SMTP email dispatch is not configured" in rec_result.message
    passed += 1
    print("[+] TEST 13 PASSED: Recovery endpoint reports unconfigured SMTP honestly (no fake email sent).")

    # TEST 14: Recovery Email Format Validation
    total += 1
    invalid_rec_rejected = False
    try:
        ForgotPasswordRequest(email="invalid_email_format")
    except ValidationError:
        invalid_rec_rejected = True
    assert invalid_rec_rejected, "Invalid recovery email must be rejected by Pydantic schema"
    passed += 1
    print("[+] TEST 14 PASSED: Recovery email format validation strictly enforced.")

    # Cleanup synthetic user
    db.query(UserSession).filter(UserSession.user_id == db_user.id).delete()
    db.delete(db_user)
    db.commit()
    db.close()

    print("=" * 60)
    print(f"TEST RESULTS: {passed}/{total} TESTS PASSED ({int((passed/total)*100)}%)")
    print("=" * 60)

    if passed == total:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
