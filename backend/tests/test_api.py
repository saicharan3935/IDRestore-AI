import pytest
import io
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def authenticate_client():
    """Authenticates the test client before running API test cases."""
    email = "api_tester@idrestore.ai"
    password = "TesterPassword2026!"
    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "API Test Harness"}
    )
    if reg.status_code != 200:
        login = client.post(
            "/api/auth/login",
            json={"email": email, "password": password}
        )
        csrf = login.json().get("csrf_token", "")
    else:
        csrf = reg.json().get("csrf_token", "")
    client.headers.update({"X-CSRF-Token": csrf})

def create_dummy_image_bytes():
    # 200x200 dummy test image with text
    img = np.full((200, 200, 3), 240, dtype=np.uint8)
    cv2.putText(img, "TEST", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (10, 10, 10), 2)
    _, buf = cv2.imencode(".jpg", img)
    return io.BytesIO(buf.tobytes())

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert "charts" in data
    assert data["stats"]["total_documents"] >= 0

def test_models_registry():
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "GFPGAN" in data
    assert "Real-ESRGAN" in data
    assert "LaMa" in data
    assert "Gemini" in data

def test_settings_endpoint():
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "gemini" in data
    assert "limits" in data
    assert "storage" in data

def test_analyze_and_restore_workflow():
    img_bytes = create_dummy_image_bytes()
    
    # 1. Analyze
    response = client.post(
        "/api/analyze",
        files={"file": ("test_doc.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    res_data = response.json()
    doc_id = res_data["document_id"]
    assert "analysis" in res_data
    assert "image_quality" in res_data["analysis"]
    
    # 2. Restore using document_id
    restore_response = client.post(
        "/api/restore",
        data={"document_id": doc_id, "options": '{"denoise": true, "sharpening": true, "contrast_enhancement": true}'}
    )
    assert restore_response.status_code == 200
    restored_data = restore_response.json()
    assert restored_data["status"] in ["COMPLETED", "REQUIRES_REVIEW"]
    assert "metrics" in restored_data
    assert restored_data["metrics"]["sharpness_after"] >= 0
    assert "restored_image_url" in restored_data
    
    # 3. Check History
    hist_resp = client.get(f"/api/history/{doc_id}")
    assert hist_resp.status_code == 200
    
    # 4. Check PDF report
    pdf_resp = client.get(f"/api/report/{doc_id}/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    
    # 5. Clean up
    del_resp = client.delete(f"/api/history/{doc_id}")
    assert del_resp.status_code == 200

def test_bulk_delete_endpoint():
    img1 = create_dummy_image_bytes()
    img2 = create_dummy_image_bytes()
    
    r1 = client.post("/api/analyze", files={"file": ("bulk1.jpg", img1, "image/jpeg")})
    r2 = client.post("/api/analyze", files={"file": ("bulk2.jpg", img2, "image/jpeg")})
    assert r1.status_code == 200
    assert r2.status_code == 200
    
    id1 = r1.json()["document_id"]
    id2 = r2.json()["document_id"]
    
    # Bulk delete
    bulk_res = client.post("/api/history/bulk-delete", json=[id1, id2])
    assert bulk_res.status_code == 200
    data = bulk_res.json()
    assert data["status"] == "success"
    assert data["deleted_count"] >= 2

def test_batch_creation_and_manifest():
    img1 = create_dummy_image_bytes()
    img2 = create_dummy_image_bytes()
    
    # Create batch
    res = client.post(
        "/api/batch",
        files=[
            ("files", ("batch_item_1.jpg", img1, "image/jpeg")),
            ("files", ("batch_item_2.jpg", img2, "image/jpeg")),
        ],
        data={"batch_name": "TestBatch_Audit"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "batch_id" in data
    batch_id = data["batch_id"]
    assert data["total_items"] == 2
    
    # Query batch status
    status_res = client.get(f"/api/batch/{batch_id}")
    assert status_res.status_code == 200
    assert status_res.json()["batch"]["name"] == "TestBatch_Audit"
    
    # Query batch CSV manifest
    manifest_res = client.get(f"/api/batch/{batch_id}/manifest")
    assert manifest_res.status_code == 200
    assert manifest_res.headers["content-type"].startswith("text/csv")
    csv_text = manifest_res.text
    assert "Document_ID" in csv_text or "Original_Filename" in csv_text

def test_invalid_file_extension():
    fake_txt = io.BytesIO(b"malicious script")
    res = client.post(
        "/api/analyze",
        files={"file": ("malicious.exe", fake_txt, "application/octet-stream")}
    )
    assert res.status_code == 400
    assert "Unsupported file" in res.json()["detail"]
