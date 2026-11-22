import io
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_end_to_end_workflow():
    # 0. AUTHENTICATE CLIENT
    email = "workflow_tester@idrestore.ai"
    password = "WorkflowPassword2026!"
    reg = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Lifecycle Specialist"}
    )
    if reg.status_code != 200:
        login = client.post("/api/auth/login", json={"email": email, "password": password})
        csrf = login.json().get("csrf_token", "")
    else:
        csrf = reg.json().get("csrf_token", "")
    client.headers.update({"X-CSRF-Token": csrf})

    # 1. CREATE SYNTHETIC DEGRADED PERSONNEL RECORD
    h, w = 400, 600
    img = np.full((h, w, 3), (240, 245, 248), dtype=np.uint8)
    cv2.putText(img, "NEXUS SYSTEMS - PERSONNEL ARCHIVE", (40, 60), cv2.FONT_HERSHEY_DUPLEX, 0.7, (30, 40, 50), 2)
    cv2.putText(img, "NAME: ARTHUR K. PENDRICK", (40, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 50, 60), 2)
    cv2.putText(img, "DEPT: ADVANCED AVIONICS", (40, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (40, 50, 60), 1)
    
    # Degrade it: blur + noise + yellow cast
    degraded = img.copy().astype(np.float32)
    degraded[:, :, 0] *= 0.7  # yellowing
    degraded = cv2.GaussianBlur(degraded, (5, 5), 1.5)
    noise = np.random.normal(0, 10, degraded.shape).astype(np.float32)
    degraded = np.clip(degraded + noise, 0, 255).astype(np.uint8)
    
    _, enc = cv2.imencode(".jpg", degraded)
    file_bytes = io.BytesIO(enc.tobytes())
    
    # STEP 1: UPLOAD & ANALYZE
    analyze_res = client.post(
        "/api/analyze",
        files={"file": ("Pendrick_Archive_1985.jpg", file_bytes, "image/jpeg")}
    )
    assert analyze_res.status_code == 200, f"Analyze failed: {analyze_res.text}"
    analyze_data = analyze_res.json()
    doc_id = analyze_data["document_id"]
    assert "analysis" in analyze_data
    assert "image_quality" in analyze_data["analysis"]
    print("\n[OK] Step 1: Upload & Analyze succeeded. Document ID:", doc_id)
    
    # STEP 2: RESTORE WITH FULL RESTORATION OPTIONS
    options_json = '{"denoise": true, "contrast_enhancement": true, "brightness_correction": true, "sharpening": true, "color_correction": true, "document_cleanup": true, "face_restoration": false, "upscale": false}'
    restore_res = client.post(
        "/api/restore",
        data={"document_id": doc_id, "options": options_json}
    )
    assert restore_res.status_code == 200, f"Restore failed: {restore_res.text}"
    restore_data = restore_res.json()
    assert restore_data["status"] in ["COMPLETED", "REQUIRES_REVIEW"]
    metrics = restore_data["metrics"]
    assert metrics["sharpness_after"] > 0
    assert metrics["processing_time_ms"] > 0
    print(f"[OK] Step 2: Restoration executed successfully. Sharpness Gain: {metrics['sharpness_gain_percent']}% in {metrics['processing_time_ms']}ms")
    
    # STEP 3: COMPARE & VERIFY IMAGE URLS
    orig_url = restore_data["original_image_url"]
    rest_url = restore_data["restored_image_url"]
    
    r_orig = client.get(orig_url)
    assert r_orig.status_code == 200
    assert len(r_orig.content) > 0
    
    r_rest = client.get(rest_url)
    assert r_rest.status_code == 200
    assert len(r_rest.content) > 0
    print("[OK] Step 3: Comparison verified. Both original and restored assets exist and serve 200 OK.")
    
    # STEP 4: DOWNLOAD ASSETS & AUDIT CERTIFICATE
    dl_res = client.get(f"/api/download/{doc_id}")
    assert dl_res.status_code == 200
    assert len(dl_res.content) > 0
    
    pdf_res = client.get(f"/api/report/{doc_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500  # valid PDF bytes
    print("[OK] Step 4: Download and PDF Technical Audit Certificate verified.")
    
    # STEP 5: VERIFY IN HISTORY LEDGER
    hist_res = client.get(f"/api/history?search=Pendrick")
    assert hist_res.status_code == 200
    items = hist_res.json()["items"]
    assert any(item["id"] == doc_id for item in items)
    print("[OK] Step 5: Document verified in historical SQLite ledger.")
    
    # STEP 6: DELETE RECORD
    del_res = client.delete(f"/api/history/{doc_id}")
    assert del_res.status_code == 200
    
    # STEP 7: VERIFY PURGED
    get_purged = client.get(f"/api/history/{doc_id}")
    assert get_purged.status_code == 404
    print("[OK] Step 6 & 7: Permanent erasure verified. Full end-to-end lifecycle passed 100%.")

if __name__ == "__main__":
    test_complete_end_to_end_workflow()
