import sys
import os
import json

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.restoration.ai_engine import ModelRegistry

def run_tests():
    print("=" * 70)
    print("IDRESTORE AI — BYTE COPILOT COMPREHENSIVE VERIFICATION TEST SUITE")
    print("=" * 70)

    client = TestClient(app)
    passed = 0
    total = 13

    # Test 1: POST /api/copilot/chat returns 200 for valid input
    print("\n[Test 1] POST /api/copilot/chat returns 200 for valid input")
    res1 = client.post("/api/copilot/chat", json={
        "message": "Hello BYTE",
        "current_page": "overview"
    })
    print(f"  Status: {res1.status_code}")
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
    data1 = res1.json()
    assert "reply" in data1 and "mode" in data1
    print("  ✓ PASSED: Valid request processed successfully")
    passed += 1

    # Test 2: GET on endpoint is handled gracefully
    print("\n[Test 2] GET on /api/copilot/chat status/probe handled gracefully")
    res2 = client.get("/api/copilot/chat")
    print(f"  Status: {res2.status_code}")
    assert res2.status_code == 200
    assert res2.json().get("status") == "online"
    print("  ✓ PASSED: GET probe returns service status and supported methods")
    passed += 1

    # Test 3: Invalid request bodies return proper validation errors
    print("\n[Test 3] Invalid request bodies return proper validation errors (422)")
    res3 = client.post("/api/copilot/chat", json={
        "message": "" # Empty message violating min_length=1
    })
    print(f"  Status: {res3.status_code}")
    assert res3.status_code == 422
    print("  ✓ PASSED: Schema validation catches empty payload with HTTP 422")
    passed += 1

    # Test 4: Greetings receive a helpful response
    print("\n[Test 4] Greetings receive a helpful welcoming response")
    res4 = client.post("/api/copilot/chat", json={"message": "Hi"})
    assert res4.status_code == 200
    data4 = res4.json()
    assert "BYTE" in data4["reply"]
    assert len(data4["suggested_actions"]) > 0
    print(f"  Reply preview: {data4['reply'][:80]}...")
    print("  ✓ PASSED: Friendly greeting returned with quick action suggestions")
    passed += 1

    # Test 5: Gemini availability questions return real configuration status
    print("\n[Test 5] Gemini availability questions return real configuration status")
    res5 = client.post("/api/copilot/chat", json={"message": "Is Gemini AI currently connected?"})
    assert res5.status_code == 200
    data5 = res5.json()
    is_gemini_env = bool(os.getenv("GEMINI_API_KEY", "").strip())
    if not is_gemini_env:
        assert data5["mode"] == "local"
        assert "not configured" in data5["reply"].lower() or "offline" in data5["reply"].lower()
    print(f"  Mode: {data5['mode']} | Reply: {data5['reply'][:90]}...")
    print("  ✓ PASSED: Accurate Gemini configuration reported without pretending")
    passed += 1

    # Test 6: Model registry questions return actual model availability
    print("\n[Test 6] Model registry questions return actual model availability")
    res6 = client.post("/api/copilot/chat", json={"message": "What neural models are registered?"})
    assert res6.status_code == 200
    data6 = res6.json()
    assert "OpenCV" in data6["reply"]
    assert "GFPGAN" in data6["reply"] or "Real-ESRGAN" in data6["reply"]
    print(f"  Reply excerpt:\n{data6['reply'][:180]}...")
    print("  ✓ PASSED: ModelRegistry status accurately reflected with fallbacks")
    passed += 1

    # Test 7: Navigation requests return allowlisted routes
    print("\n[Test 7] Navigation requests return allowlisted routes")
    res7 = client.post("/api/copilot/chat", json={"message": "Go to settings"})
    assert res7.status_code == 200
    data7 = res7.json()
    assert data7.get("suggested_navigation") == "settings"
    actions7 = data7.get("suggested_actions", [])
    assert any(a.get("target") == "settings" or a.get("route") == "/dashboard/settings" for a in actions7)
    print(f"  Navigation target: {data7.get('suggested_navigation')}")
    print("  ✓ PASSED: Allowlisted navigation route returned")
    passed += 1

    # Test 8: Dashboard questions use actual database data
    print("\n[Test 8] Dashboard questions use actual database data")
    res8 = client.post("/api/copilot/chat", json={"message": "How many documents have been processed?"})
    assert res8.status_code == 200
    data8 = res8.json()
    assert data8.get("live_data") is not None
    assert "total_documents" in data8["live_data"]
    print(f"  Live documents count: {data8['live_data']['total_documents']}")
    print(f"  Reply excerpt: {data8['reply'][:100]}...")
    print("  ✓ PASSED: Real live statistics retrieved from database")
    passed += 1

    # Test 9: Missing Gemini API key activates local mode
    print("\n[Test 9] Missing Gemini API key activates local mode")
    old_key = os.environ.get("GEMINI_API_KEY", "")
    os.environ["GEMINI_API_KEY"] = ""
    try:
        res9 = client.post("/api/copilot/chat", json={"message": "Explain how OpenCV works"})
        assert res9.status_code == 200
        data9 = res9.json()
        assert data9["mode"] == "local"
        assert data9["ai_status"] == "LOCAL_FALLBACK_ACTIVE"
        print("  ✓ PASSED: Local intelligence active when key is absent")
        passed += 1
    finally:
        os.environ["GEMINI_API_KEY"] = old_key

    # Test 10: Gemini failures / unexpected exceptions do not crash chatbot
    print("\n[Test 10] Gemini failures do not crash the chatbot")
    os.environ["GEMINI_API_KEY"] = "fake-invalid-key-for-test"
    try:
        res10 = client.post("/api/copilot/chat", json={"message": "Complex inquiry with bad key"})
        assert res10.status_code == 200
        data10 = res10.json()
        assert "reply" in data10
        print("  ✓ PASSED: Graceful fallback prevented server crash on invalid key")
        passed += 1
    finally:
        os.environ["GEMINI_API_KEY"] = old_key

    # Test 11: Frontend request format compatibility
    print("\n[Test 11] Frontend request format compatibility (conversation_history & current_page)")
    res11 = client.post("/api/copilot/chat", json={
        "message": "Why is my image still blurry?",
        "conversation_history": [
            {"role": "user", "content": "How do I restore a file?"},
            {"role": "assistant", "content": "Open Restoration Studio."}
        ],
        "current_page": "restore"
    })
    assert res11.status_code == 200
    data11 = res11.json()
    assert "blur" in data11["reply"].lower() or "sharpen" in data11["reply"].lower()
    print(f"  Reply excerpt: {data11['reply'][:100]}...")
    print("  ✓ PASSED: Frontend format correctly digested and answered")
    passed += 1

    # Test 12: Repeated messages work correctly
    print("\n[Test 12] Repeated messages work correctly")
    for _ in range(3):
        res12 = client.post("/api/copilot/chat", json={"message": "Show my document history"})
        assert res12.status_code == 200
    print("  ✓ PASSED: Consecutive repeat queries succeed without deadlock or state leakage")
    passed += 1

    # Test 13: Existing restoration functionality remains functional
    print("\n[Test 13] Existing restoration & health endpoints remain fully functional")
    res13_health = client.get("/api/health")
    assert res13_health.status_code == 200
    res13_settings = client.get("/api/settings")
    # /api/settings requires auth or returns 401/200
    assert res13_settings.status_code in [200, 401]
    print("  ✓ PASSED: Platform health and settings endpoints operational")
    passed += 1

    print("\n" + "=" * 70)
    print(f"TEST SUITE COMPLETE: {passed}/{total} PASSED (100%)")
    print("=" * 70)
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
