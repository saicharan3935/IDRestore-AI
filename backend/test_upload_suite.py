import sys
import os

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User

def run_tests():
    print("=" * 70)
    print("IDRESTORE AI — IMAGE UPLOAD & RESTORATION TEST SUITE")
    print("=" * 70)

    db = SessionLocal()
    # Find test user
    user = db.query(User).filter(User.email == "synthetic_eval_analyst@idrestore.ai").first()
    assert user is not None, "Test user not found in database"
    user_id = user.id
    db.close()

    # Authenticate client
    client = TestClient(app)
    login_res = client.post("/api/auth/login", json={
        "email": "synthetic_eval_analyst@idrestore.ai",
        "password": "SecurePassword2026!"
    })
    print(f"Login status: {login_res.status_code}")
    assert login_res.status_code == 200

    # 1. Test Valid JPG Upload and Restoration
    print("\n[Test 1] Upload valid JPG and execute restoration")
    sample_jpg = os.path.join(backend_dir, "app", "storage", "samples", "demo_original_degraded.jpg")
    with open(sample_jpg, "rb") as f:
        res = client.post("/api/restore", files={"file": ("test_doc.jpg", f, "image/jpeg")})
    print(f"  Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "document_id" in data
    assert "restored_image_url" in data
    assert "report_url" in data
    doc_id = data["document_id"]
    restored_url = data["restored_image_url"]
    report_url = data["report_url"]
    print(f"  Document ID: {doc_id}")
    print(f"  Restored URL: {restored_url}")
    print(f"  Report URL: {report_url}")
    print("  ✓ PASSED: Valid JPG restored successfully")

    # 2. Test Valid PNG Upload
    print("\n[Test 2] Upload valid PNG image")
    from PIL import Image
    import io
    png_buffer = io.BytesIO()
    Image.new("RGB", (400, 300), color=(200, 220, 240)).save(png_buffer, format="PNG")
    png_bytes = png_buffer.getvalue()

    res = client.post("/api/restore", files={"file": ("test_doc.png", png_bytes, "image/png")})
    print(f"  Status: {res.status_code}")
    assert res.status_code == 200
    print("  ✓ PASSED: Valid PNG processed successfully")

    # 3. Test Unsupported File Format (.txt)
    print("\n[Test 3] Upload unsupported file format (.txt)")
    txt_bytes = b"This is a text file, not an image."
    res = client.post("/api/restore", files={"file": ("notes.txt", txt_bytes, "text/plain")})
    print(f"  Status: {res.status_code}")
    assert res.status_code == 400
    print("  ✓ PASSED: Unsupported format safely rejected with 400 Bad Request")

    # 4. Test Oversized File (> 25MB)
    print("\n[Test 4] Upload oversized image (> 25MB)")
    huge_bytes = b"0" * (26 * 1024 * 1024)
    res = client.post("/api/restore", files={"file": ("huge.jpg", huge_bytes, "image/jpeg")})
    print(f"  Status: {res.status_code}")
    assert res.status_code == 400
    print("  ✓ PASSED: Oversized file safely rejected with 400 Bad Request")

    # 5. Test Download Enhanced Image File
    print("\n[Test 5] Download restored image file")
    res = client.get(restored_url)
    print(f"  Status: {res.status_code}")
    assert res.status_code == 200
    assert len(res.content) > 1000
    print("  ✓ PASSED: Enhanced restored image downloaded successfully")

    # 6. Test Download PDF Audit Report
    print("\n[Test 6] Download PDF audit report")
    res = client.get(report_url)
    print(f"  Status: {res.status_code}")
    assert res.status_code == 200
    assert res.headers.get("content-type") == "application/pdf"
    print("  ✓ PASSED: PDF audit report downloaded successfully")

    print("\n" + "=" * 70)
    print("ALL 6 RESTORATION & UPLOAD TESTS PASSED (100%)")
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
