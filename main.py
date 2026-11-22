"""
IDRestore AI — Root Entry Point
Allows starting the server directly from the root workspace directory.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

if __name__ == "__main__":
    import uvicorn
    print("================================================================")
    print("   IDRESTORE AI — OBSIDIAN FUTURISM EDITION")
    print("   Unified Enterprise Platform: http://localhost:8000")
    print("================================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
