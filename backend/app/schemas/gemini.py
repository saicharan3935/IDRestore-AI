from typing import List, Optional
from pydantic import BaseModel, Field

class ImageQualityAssessment(BaseModel):
    rating: str = Field(description="'excellent', 'good', 'fair', 'poor', or 'critical'")
    assessment: str = Field(description="Summary of overall visual quality and degradation")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score between 0 and 1")

class DetectedIssue(BaseModel):
    issue: str = Field(description="Name of issue: 'blur', 'noise', 'fading', 'scratches', 'low_contrast', 'uneven_lighting', 'yellowing', etc.")
    severity: str = Field(description="'low', 'medium', 'high', or 'critical'")
    description: str = Field(description="Detailed observation of the issue")

class GeminiAnalysisResult(BaseModel):
    image_quality: ImageQualityAssessment
    detected_issues: List[DetectedIssue] = Field(default_factory=list)
    recommended_operations: List[str] = Field(default_factory=list)
    document_readability: str = Field(default="partially_readable", description="'high', 'medium', 'partially_readable', or 'unreadable'")
    face_visibility: str = Field(default="not_present", description="'clear', 'degraded', 'obscured', or 'not_present'")
    restoration_notes: List[str] = Field(default_factory=list)
    confidence_or_uncertainty: List[str] = Field(default_factory=list)
    ai_provider: str = Field(default="Google Gemini")
