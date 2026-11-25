import sys
import os

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

def run_chat_tests():
    print("=" * 60)
    print("BYTE AI COPILOT CHAT ENDPOINT TEST SUITE (IN-PROCESS)")
    print("=" * 60)

    client = TestClient(app)

    # 1. Health check
    res = client.get("/api/health")
    print(f"Health check: {res.status_code} -> {res.json().get('status')}")
    assert res.status_code == 200

    test_cases = [
        {
            "name": "Blurry document restoration guidance",
            "message": "How can I restore a blurry employee document?",
            "tab": "restore",
            "expected_intent": "restore_guidance"
        },
        {
            "name": "Live statistics query",
            "message": "How many documents have been processed?",
            "tab": "overview",
            "expected_intent": "stats_query"
        },
        {
            "name": "Recent restorations query",
            "message": "Show my recent restorations",
            "tab": "history",
            "expected_intent": "stats_query"
        },
        {
            "name": "Navigation to batch processing",
            "message": "Open batch processing",
            "tab": "overview",
            "expected_nav": "batch"
        },
        {
            "name": "Gemini AI explanation",
            "message": "What is Gemini AI used for?",
            "tab": "analysis",
            "expected_intent": "explanation"
        },
        {
            "name": "Why still blurry explanation",
            "message": "Why is my image still blurry?",
            "tab": "restore",
            "expected_intent": "restore_guidance"
        },
        {
            "name": "Download guidance",
            "message": "How can I download my restored document?",
            "tab": "history",
            "expected_intent": "general_help"
        },
        {
            "name": "Navigation to settings",
            "message": "Go to settings",
            "tab": "overview",
            "expected_nav": "settings"
        }
    ]

    passed = 0
    for idx, tc in enumerate(test_cases, 1):
        print(f"\n[{idx}/{len(test_cases)}] Testing: {tc['name']}")
        payload = {
            "message": tc["message"],
            "current_tab": tc["tab"],
            "history": []
        }
        res = client.post("/api/chat", json=payload)
        if res.status_code != 200:
            print(f"❌ Failed: HTTP {res.status_code} - {res.text}")
            continue

        data = res.json()
        print(f"  Status: {res.status_code}")
        print(f"  AI Status: {data.get('ai_status')}")
        print(f"  Intent: {data.get('intent')}")
        print(f"  Navigation Target: {data.get('suggested_navigation')}")
        print(f"  Actions: {[a['label'] for a in data.get('suggested_actions', [])]}")
        preview = data.get('reply', '')[:100].replace('\n', ' ')
        print(f"  Reply Preview: {preview}...")

        assert "reply" in data and len(data["reply"]) > 10
        if "expected_nav" in tc:
            assert data.get("suggested_navigation") == tc["expected_nav"], f"Expected {tc['expected_nav']}, got {data.get('suggested_navigation')}"
        if "expected_intent" in tc:
            assert data.get("intent") == tc["expected_intent"], f"Expected {tc['expected_intent']}, got {data.get('intent')}"

        passed += 1
        print("  ✓ PASSED")

    print(f"\nTotal tests passed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

if __name__ == "__main__":
    success = run_chat_tests()
    sys.exit(0 if success else 1)
