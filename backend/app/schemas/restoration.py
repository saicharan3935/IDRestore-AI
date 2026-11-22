from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RestorationOptions(BaseModel):
    automatic_enhancement: bool = False
    denoise: bool = True
    contrast_enhancement: bool = True
    brightness_correction: bool = True
    sharpening: bool = True
    color_correction: bool = True
    face_restoration: bool = False
    upscale: bool = False
    scale_factor: int = 2
    document_cleanup: bool = False
    notes: Optional[str] = None

class MetricMeasurements(BaseModel):
    sharpness_before: float
    sharpness_after: float
    sharpness_gain_percent: float
    contrast_before: float
    contrast_after: float
    brightness_before: float
    brightness_after: float
    noise_before: float
    noise_after: float
    psnr_db: Optional[float] = None
    ssim: Optional[float] = None
    processing_time_ms: float
    resolution_before: str
    resolution_after: str

class RestorationResult(BaseModel):
    document_id: str
    status: str
    operations_executed: List[str]
    ai_models_used: List[str]
    metrics: MetricMeasurements
    integrity_warnings: List[str]
    restored_image_url: str
    original_image_url: str
