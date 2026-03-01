from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.core.config import settings

db = SessionLocal()

# Atualiza o número para o que o Sandbox está usando
db.query(Tenant).filter(Tenant.id == "clinica-teste-aracaju").update({
    "whatsapp_number": "14155238886"   # sem o + e sem whatsapp:
})

db.commit()
db.close()

print("✅ Número do tenant atualizado para +14155238886")
print("Agora teste novamente enviando 'oi' para o Sandbox!")