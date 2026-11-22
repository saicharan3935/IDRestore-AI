from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: str
    original_filename: str
    stored_filename: str
    restored_filename: Optional[str] = None
    file_size_bytes: int
    mime_type: str
    width: int
    height: int
    restored_width: Optional[int] = None
    restored_height: Optional[int] = None
    status: str
    batch_id: Optional[str] = None
    operations_applied: List[str] = []
    gemini_analysis: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    integrity_warnings: List[str] = []
    ai_models_used: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    original_url: Optional[str] = None
    restored_url: Optional[str] = None

class DashboardStats(BaseModel):
    total_documents: int
    successful_restorations: int
    requiring_review: int
    failed_documents: int
    average_processing_time_ms: float
    average_sharpness_gain: float
    total_batch_jobs: int
    system_health: str = "operational"

class BatchCreateRequest(BaseModel):
    name: str
    options: Optional[Dict[str, Any]] = None
