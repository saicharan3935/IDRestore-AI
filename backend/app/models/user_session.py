import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_token = Column(String, unique=True, index=True, nullable=False)
    csrf_token = Column(String, nullable=False)
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")

    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        if self.expires_at.tzinfo is None:
            return self.expires_at < datetime.utcnow()
        return self.expires_at < now
