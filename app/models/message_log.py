from sqlalchemy import Column, String, DateTime, ForeignKey, func, Text
from app.core.database import Base

class MessageLog(Base):
    __tablename__ = "message_logs"

    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    from_phone = Column(String, nullable=False)
    to_phone = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    direction = Column(String)   # "in" ou "out"
    created_at = Column(DateTime, server_default=func.now())