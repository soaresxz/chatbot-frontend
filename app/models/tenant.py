from sqlalchemy import Column, String, Boolean, DateTime, func
from app.models.appointment import relationship
from app.core.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, index=True)           # ex: "clinica_sorriso_aracaju"
    name = Column(String, nullable=False)        
    human_mode_active = Column(Boolean, default=False)
    human_mode_until = Column(DateTime, nullable=True)   # opcional: timeout automático# Nome da clínica
    dentist_name = Column(String, nullable=False)               # Nome do dentista
    whatsapp_number = Column(String, unique=True, nullable=False)  # +15079363189 (sem "whatsapp:")
    twilio_sid = Column(String, nullable=True)  
    plan = Column(String, default="basic")# futuro
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    appointments = relationship("Appointment", back_populates="tenant", cascade="all, delete-orphan")
    attendant_phone = Column(String, nullable=True)  # número da atendente (ex: +557981171862)

    def __repr__(self):
        return f"<Tenant {self.name}>"