import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "IDRestore AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    STORAGE_DIR: Path = BASE_DIR / "app" / "storage"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    PROCESSED_DIR: Path = STORAGE_DIR / "processed"
    REPORTS_DIR: Path = STORAGE_DIR / "reports"
    SAMPLES_DIR: Path = STORAGE_DIR / "samples"
    
    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Upload limits
    MAX_FILE_SIZE_MB: int = 25
    MAX_IMAGE_DIMENSION: int = 4096
    ALLOWED_EXTENSIONS: set = {"jpg", "jpeg", "png", "webp"}
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/idrestore.db"
    
    # Retention
    DEFAULT_RETENTION_DAYS: int = 30
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Ensure directories exist
for path in [settings.UPLOADS_DIR, settings.PROCESSED_DIR, settings.REPORTS_DIR, settings.SAMPLES_DIR]:
    path.mkdir(parents=True, exist_ok=True)
