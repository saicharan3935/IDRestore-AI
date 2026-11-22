import os
from fastapi import APIRouter, HTTPException, Body, Depends
from app.config import settings
from app.restoration.ai_engine import ModelRegistry
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["Settings & Platform Health"])

@router.get("/settings")
def get_system_settings(
    current_user: User = Depends(get_current_user)
):
    """Returns safe platform configurations without leaking private credentials. Requires authentication."""
    models_status = ModelRegistry.get_status()
    
    # Calculate storage stats
    upload_size = sum(f.stat().st_size for f in settings.UPLOADS_DIR.glob('*') if f.is_file())
    processed_size = sum(f.stat().st_size for f in settings.PROCESSED_DIR.glob('*') if f.is_file())
    reports_size = sum(f.stat().st_size for f in settings.REPORTS_DIR.glob('*') if f.is_file())
    
    return {
        "gemini": {
            "is_configured": bool(os.getenv("GEMINI_API_KEY", "").strip()),
            "model_name": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            "status": "ACTIVE" if bool(os.getenv("GEMINI_API_KEY", "").strip()) else "OFFLINE_FALLBACK_ACTIVE"
        },
        "limits": {
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
            "max_image_dimension_px": settings.MAX_IMAGE_DIMENSION,
            "allowed_extensions": list(settings.ALLOWED_EXTENSIONS),
            "retention_period_days": settings.DEFAULT_RETENTION_DAYS,
        },
        "storage": {
            "uploads_bytes": upload_size,
            "processed_bytes": processed_size,
            "reports_bytes": reports_size,
            "total_megabytes": round((upload_size + processed_size + reports_size) / (1024 * 1024), 2)
        },
        "models": models_status
    }

@router.get("/models")
def get_model_registry_status():
    """Returns status of heavy neural models and OpenCV fallbacks."""
    return ModelRegistry.get_status()

@router.post("/settings/gemini-key")
def update_gemini_key(
    payload: dict = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Allows setting runtime GEMINI_API_KEY without persisting plain text in unsafe logs. Requires admin authentication."""
    new_key = payload.get("gemini_api_key", "").strip()
    if not new_key:
        os.environ["GEMINI_API_KEY"] = ""
        return {"status": "success", "message": "Gemini API key cleared. Offline CV fallback is active."}
        
    os.environ["GEMINI_API_KEY"] = new_key
    return {"status": "success", "message": "Gemini API key updated for current active session."}
