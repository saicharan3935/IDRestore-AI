import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database.session import engine, Base
from app.models import User, UserSession, Document, BatchJob  # Ensure all models are registered
from app.routes import auth, dashboard, analyze, restore, history, batch, settings as settings_route, chat
from app.storage.seed_samples import ensure_synthetic_sample_documents

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite columns if upgrading existing database
try:
    with engine.connect() as conn:
        for table in ["documents", "batch_jobs"]:
            result = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
            cols = [r[1] for r in result]
            if "user_id" not in cols:
                conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN user_id VARCHAR")
        conn.commit()
except Exception as e:
    print(f"Schema migration note: {e}")

# Ensure sample seed exists
try:
    ensure_synthetic_sample_documents()
except Exception as e:
    print(f"Warning: sample document init: {e}")

app = FastAPI(
    title="IDRestore AI API",
    description="Enterprise Generative AI Document Restoration Platform for HRMS Migration",
    version="1.0.0"
)

# CORS configured for HttpOnly cookie credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://id-restore-ai.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(analyze.router)
app.include_router(restore.router)
app.include_router(history.router)
app.include_router(batch.router)
app.include_router(settings_route.router)
app.include_router(chat.router)

# Secure File Serving with Path Traversal Protection
@app.get("/api/files/upload/{filename}")
def get_uploaded_file(filename: str):
    safe_name = os.path.basename(filename)
    file_path = (settings.UPLOADS_DIR / safe_name).resolve()
    if not str(file_path).startswith(str(settings.UPLOADS_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Forbidden path")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

@app.get("/api/files/processed/{filename}")
def get_processed_file(filename: str):
    safe_name = os.path.basename(filename)
    file_path = (settings.PROCESSED_DIR / safe_name).resolve()
    if not str(file_path).startswith(str(settings.PROCESSED_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Forbidden path")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(file_path))

# Serve Frontend static assets in production
FRONTEND_DIST = settings.BASE_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        # Never intercept API calls, openapi schema, or swagger docs
        if full_path.startswith("api/") or full_path in ["openapi.json", "docs", "redoc"]:
            raise HTTPException(status_code=404, detail="Not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
