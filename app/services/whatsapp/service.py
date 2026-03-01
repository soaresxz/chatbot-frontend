import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.models.message_log import MessageLog
from app.models.conversation_status import ConversationStatus
from app.services.whatsapp.twilio_provider import TwilioProvider
from app.services.intent_matcher import get_quick_response
from app.services.basic_bot import handle_basic_plan
from app.services.ai.gemini_agent import get_ai_response
from app.core.websocket_manager import broadcast

FALLBACK_MESSAGE = "Aguarde um momento. Uma atendente vai te responder em breve. 😊"

async def process_incoming_message(from_number: str, body: str, to_number: str):
    db: Session = SessionLocal()
    try:
        tenant = db.query(Tenant).filter(
            Tenant.whatsapp_number.ilike(f"%{to_number.replace('whatsapp:', '').replace('+', '').strip()}%")
        ).first()

        if not tenant:
            return

        # Verifica modo humano
        status = db.query(ConversationStatus).filter(
            ConversationStatus.tenant_id == tenant.id,
            ConversationStatus.patient_phone == from_number,
            ConversationStatus.human_mode_active == True
        ).first()

        if status and status.human_mode_until and datetime.utcnow() < status.human_mode_until:
            return  # não responde

        # Salva mensagem de entrada
        log_in = MessageLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant.id,
            from_phone=from_number,
            to_phone=to_number,
            message=body,
            direction="in",
            created_at=datetime.utcnow()
        )
        db.add(log_in)
        db.commit()

        await broadcast({
            "type": "new_message",
            "from": "paciente",
            "message": body,
            "is_bot": False
        })

        # Gera resposta conforme plano
        if tenant.plan == "basic":
            response_text = await handle_basic_plan(body, from_number, tenant)
        else:
            quick = get_quick_response(body, tenant.name or "clínica")
            response_text = quick or await get_ai_response(body, tenant, from_number) or FALLBACK_MESSAGE

        # Envia resposta
        provider = TwilioProvider()
        await provider.send_message(from_number, response_text)

        # Log de saída
        log_out = MessageLog(
            id=str(uuid.uuid4()),
            tenant_id=tenant.id,
            from_phone=to_number,
            to_phone=from_number,
            message=response_text,
            direction="out",
            created_at=datetime.utcnow()
        )
        db.add(log_out)
        db.commit()

        await broadcast({
            "type": "new_message",
            "from": "bot",
            "message": response_text,
            "is_bot": True
        })

        print(f"✅ Resposta enviada para {from_number}")

    finally:
        db.close()