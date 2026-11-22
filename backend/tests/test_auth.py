import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_unauthorized_endpoints():
    """Verify that protected API endpoints reject unauthenticated requests with 401."""
    # Test dashboard stats
    r = client.get("/api/dashboard/stats")
    assert r.status_code == 401
    assert "Authentication required" in r.json()["detail"]

    # Test history
    r = client.get("/api/history")
    assert r.status_code == 401

    # Test settings
    r = client.get("/api/settings")
    assert r.status_code == 401

    # Test analyze
    r = client.post("/api/analyze")
    assert r.status_code == 401

def test_registration_and_login_flow():
    """Verify user registration, cookie issuance, profile retrieval, and logout."""
    rand = uuid.uuid4().hex[:8]
    email = f"test_{rand}@idrestore.ai"
    password = "SecurePassword123!"

    # 1. Register new account
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Test Security Officer",
            "role": "HR_ADMIN"
        }
    )
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert reg_data["user"]["email"] == email
    assert "csrf_token" in reg_data
    assert "idrestore_session" in reg_res.cookies

    # 2. Duplicate registration should fail
    dup_res = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Duplicate Officer"
        }
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Invalid login
    bad_login = client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPassword!"}
    )
    assert bad_login.status_code == 401

    # 4. Successful login
    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["user"]["email"] == email
    csrf_token = login_data["csrf_token"]

    # 5. Check authenticated profile via /api/auth/me
    auth_headers = {"X-CSRF-Token": csrf_token}
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 6. Access protected dashboard stats with authenticated cookies
    stats_res = client.get("/api/dashboard/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    assert "stats" in stats_res.json()

    # 7. Logout
    logout_res = client.post("/api/auth/logout", headers=auth_headers)
    assert logout_res.status_code == 200

    # 8. Profile should now be unauthorized
    me_after = client.get("/api/auth/me")
    assert me_after.status_code == 401

def test_cross_user_document_authorization():
    """Verify that User B cannot access, download, or delete User A's document."""
    import numpy as np
    import cv2
    import io

    # Create dummy image
    img = np.full((100, 100, 3), 200, dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)

    # User A Client
    rand_a = uuid.uuid4().hex[:8]
    email_a = f"user_{rand_a}@idrestore.ai"
    client_a = TestClient(app)
    reg_a = client_a.post("/api/auth/register", json={
        "email": email_a,
        "password": "PasswordUserA123!",
        "full_name": "User Alpha"
    })
    assert reg_a.status_code == 200, f"Register A failed: {reg_a.text}"
    csrf_a = reg_a.json()["csrf_token"]
    headers_a = {"X-CSRF-Token": csrf_a}

    # User A uploads document
    upload_res = client_a.post(
        "/api/analyze",
        files={"file": ("confidential_record_a.jpg", io.BytesIO(buf.tobytes()), "image/jpeg")},
        headers=headers_a
    )
    assert upload_res.status_code == 200
    doc_id_a = upload_res.json()["document_id"]

    # User B Client
    rand_b = uuid.uuid4().hex[:8]
    email_b = f"user_{rand_b}@idrestore.ai"
    client_b = TestClient(app)
    reg_b = client_b.post("/api/auth/register", json={
        "email": email_b,
        "password": "PasswordUserB123!",
        "full_name": "User Beta"
    })
    assert reg_b.status_code == 200, f"Register B failed: {reg_b.text}"
    csrf_b = reg_b.json()["csrf_token"]
    headers_b = {"X-CSRF-Token": csrf_b}

    # User B attempts to access User A's document metadata -> 403 Forbidden
    detail_res = client_b.get(f"/api/history/{doc_id_a}", headers=headers_b)
    assert detail_res.status_code == 403
    assert "Access denied" in detail_res.json()["detail"]

    # User B attempts to delete User A's document -> 403 Forbidden
    delete_res = client_b.delete(f"/api/history/{doc_id_a}", headers=headers_b)
    assert delete_res.status_code == 403

    # User B attempts to download User A's document -> 403 Forbidden
    dl_res = client_b.get(f"/api/download/{doc_id_a}", headers=headers_b)
    assert dl_res.status_code == 403
