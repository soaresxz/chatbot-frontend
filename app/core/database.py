import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import update
from app.core.config import settings

# Pega DATABASE_URL do Railway (prioridade máxima)
DATABASE_URL = os.getenv("DATABASE_URL") or getattr(settings, "DATABASE_URL", None)

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL não encontrada! Verifique no Railway.")

# Engine síncrono (igual ao que você usava antes)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # evita conexões mortas
    echo=False,           # mude para True só se quiser ver os SQLs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency (mantém o mesmo nome que você já usava)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Reset do modo humano (igual ao seu código antigo)
def reset_human_modes():
    from app.models.tenant import Tenant   # ajuste o import se necessário

    db = SessionLocal()
    try:
        db.query(Tenant).update({
            Tenant.human_mode_active: False,
            Tenant.human_mode_until: None
        })
        db.commit()
        print("✅ Modo humano resetado para todos os tenants!")
    finally:
        db.close()

# Criar tabelas + reset automático
def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ Todas as tabelas criadas/verficadas com sucesso!")
    reset_human_modes()