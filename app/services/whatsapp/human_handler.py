from app.core.database import SessionLocal
from app.models.conversation_status import ConversationStatus
from datetime import datetime, timedelta
from app.core.websocket_manager import broadcast
import logging

logger = logging.getLogger(__name__)

async def handle_attendant_message(tenant, patient_phone: str):
    """Atendente enviou mensagem → ativa modo humano para esse paciente"""
    db = SessionLocal()
    try:
        status = db.query(ConversationStatus).filter(
            ConversationStatus.tenant_id == tenant.id,
            ConversationStatus.patient_phone == patient_phone
        ).first()

        if not status:
            status = ConversationStatus(
                tenant_id=tenant.id,
                patient_phone=patient_phone,
                human_mode_active=True,
                human_mode_until=datetime.utcnow() + timedelta(hours=24)
            )
            db.add(status)
        else:
            status.human_mode_active = True
            status.human_mode_until = datetime.utcnow() + timedelta(hours=24)
            status.updated_at = datetime.utcnow()

        db.commit()

        print(f"👩‍💼 MODO HUMANO ATIVADO AUTOMATICAMENTE para {patient_phone} (atendente enviou mensagem)")

        # Notifica o dashboard (se estiver aberto)
        await broadcast({
            "type": "human_activated",
            "patient_phone": patient_phone,
            "message": "Atendente assumiu a conversa"
        })

    except Exception as e:
        logger.error(f"Erro ao ativar modo humano: {e}")
    finally:
        db.close()