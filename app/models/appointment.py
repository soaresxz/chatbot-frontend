from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"      # aguardando confirmação
    CONFIRMED = "confirmed"  # confirmado
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    
    patient_name = Column(String, nullable=False)
    patient_phone = Column(String, nullable=False)
    dentist_name = Column(String, nullable=True)      # ex: "Dr. João"
    procedure = Column(String, nullable=True)         # ex: "Avaliação", "Limpeza", "Aparelho"
    
    scheduled_date = Column(DateTime, nullable=False)  # data e hora exata
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.PENDING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)

    # Relacionamento com Tenant
    tenant = relationship("Tenant", back_populates="appointments")