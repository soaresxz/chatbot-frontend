from app.core.database import SessionLocal, create_tables
from app.models.tenant import Tenant
from app.core.config import settings   # ← para pegar o número automático

def create_first_tenant():
    create_tables()

    db = SessionLocal()

    # Deleta pelo ID (mais seguro que pelo número)
    db.query(Tenant).filter(Tenant.id == "clinica-teste-aracaju").delete()
    db.commit()

    tenant = Tenant(
        id="clinica-teste-aracaju",
        name="Sua Clínica Odontológica",      # ← MUDE AQUI para o nome real da clínica
        dentist_name="Dr. Gabriel",           # ← MUDE AQUI para o nome real do dentista
        whatsapp_number=settings.TWILIO_WHATSAPP_NUMBER  # pega automático do .env (+15079363189)
    )

    db.add(tenant)
    db.commit()

    print("✅ CLÍNICA CADASTRADA COM SUCESSO!")
    print(f"   ID:          {tenant.id}")
    print(f"   Nome:        {tenant.name}")
    print(f"   Dentista:    {tenant.dentist_name}")
    print(f"   WhatsApp:    {tenant.whatsapp_number}")
    print("\n✅ Tudo pronto! Agora vamos rodar o servidor.")

    db.close()

if __name__ == "__main__":
    create_first_tenant()