from app.core.database import SessionLocal, create_tables
from app.models.service import Service

def seed_services():
    create_tables()
    db = SessionLocal()

    tenant_id = "clinica-teste-aracaju"

    services = [
        {"name": "Aparelho Fixo Metálico", "price_from": 1200.00, "duration_minutes": "60"},
        {"name": "Aparelho Estético (Cerâmico)", "price_from": 1800.00, "duration_minutes": "60"},
        {"name": "Clareamento Dental", "price_from": 650.00, "duration_minutes": "90"},
        {"name": "Implante Unitário", "price_from": 2500.00, "duration_minutes": "120"},
        {"name": "Limpeza / Profilaxia", "price_from": 180.00, "duration_minutes": "45"},
        {"name": "Faceta de Porcelana", "price_from": 850.00, "duration_minutes": "60"},
        {"name": "Canal + Coroa", "price_from": 950.00, "duration_minutes": "90"},
    ]

    # Limpa serviços antigos
    db.query(Service).filter(Service.tenant_id == tenant_id).delete()

    for s in services:
        service = Service(
            tenant_id=tenant_id,
            name=s["name"],
            price_from=s["price_from"],
            duration_minutes=s["duration_minutes"]
        )
        db.add(service)

    db.commit()
    db.close()
    print("✅ 7 serviços cadastrados com sucesso!")

if __name__ == "__main__":
    seed_services()