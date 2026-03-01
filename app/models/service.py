from sqlalchemy import Column, String, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)                    # ex: "Aparelho Fixo"
    price_from = Column(Numeric(10, 2), nullable=False)      # preço a partir de
    duration_minutes = Column(String, nullable=True)         # ex: "60" ou "120-180"
    description = Column(String, nullable=True)              # opcional
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Service {self.name} - R${self.price_from}>"
    

    