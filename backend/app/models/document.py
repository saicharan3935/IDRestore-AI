from datetime import datetime, timezone
import json
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    restored_filename = Column(String, nullable=True)
    file_size_bytes = Column(Integer, default=0)
    mime_type = Column(String, default="image/jpeg")
    
    # Dimensions
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    restored_width = Column(Integer, nullable=True)
    restored_height = Column(Integer, nullable=True)
    
    # Status: PENDING, ANALYZING, RESTORING, COMPLETED, FAILED, REQUIRES_REVIEW
    status = Column(String, default="PENDING", index=True)
    batch_id = Column(String, nullable=True, index=True)
    
    # JSON data
    operations_applied = Column(JSON, default=list)
    gemini_analysis = Column(JSON, default=dict)
    metrics = Column(JSON, default=dict)
    integrity_warnings = Column(JSON, default=list)
    ai_models_used = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="documents")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "original_filename": self.original_filename,
            "stored_filename": self.stored_filename,
            "restored_filename": self.restored_filename,
            "file_size_bytes": self.file_size_bytes,
            "mime_type": self.mime_type,
            "width": self.width,
            "height": self.height,
            "restored_width": self.restored_width,
            "restored_height": self.restored_height,
            "status": self.status,
            "batch_id": self.batch_id,
            "operations_applied": self.operations_applied or [],
            "gemini_analysis": self.gemini_analysis or {},
            "metrics": self.metrics or {},
            "integrity_warnings": self.integrity_warnings or [],
            "ai_models_used": self.ai_models_used or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
