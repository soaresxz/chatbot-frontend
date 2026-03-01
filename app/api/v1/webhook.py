from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from app.services.whatsapp.service import process_incoming_message
from app.services.whatsapp.human_handler import handle_attendant_message
from app.core.database import get_db
from app.models.tenant import Tenant

router = APIRouter()

@router.post("/twilio/webhook")
async def twilio_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        form = await request.form()
        
        from_number = form.get("From", "").strip()
        to_number   = form.get("To", "").strip()
        body        = form.get("Body", "").strip()

        # Normalização do número
        def normalize(n: str) -> str:
            return ''.join(filter(str.isdigit, n.replace("whatsapp:", "").replace("+", "")))

        # Busca tenant
        tenant = db.query(Tenant).filter(
            Tenant.whatsapp_number.ilike(f"%{normalize(to_number)}%")
        ).first()

        if not tenant:
            return {"status": "ignored"}

        # Mensagem da atendente → modo humano
        if normalize(from_number) == normalize(tenant.whatsapp_number):
            handle_attendant_message(tenant, to_number)
            return {"status": "human_takeover"}

        # Mensagem do paciente
        await process_incoming_message(from_number, body, to_number)
        return {"status": "processed"}

    except Exception as e:
        print(f"❌ Erro no webhook: {e}")
        return {"status": "error"}