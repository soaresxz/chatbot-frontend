from app.core.database import SessionLocal
from app.models.conversation_status import ConversationStatus
from datetime import datetime, timedelta
from app.core.websocket_manager import broadcast
import logging

logger = logging.getLogger(__name__)

async def handle_attendant_message(tenant, from_number: str, body: str):
    """Quando a atendente envia mensagem → ativa modo humano para o paciente atual"""
    db = SessionLocal()
    try:
        # Por enquanto usamos o último paciente que interagiu (melhorar depois com Redis ou contexto)
        # Para MVP vamos assumir que a atendente está respondendo o último paciente ativo
        # (você pode melhorar depois com comando "paciente +55xxxx")

        status = db.query(ConversationStatus).filter(
            ConversationStatus.tenant_id == tenant.id,
            ConversationStatus.human_mode_active == False
        ).order_by(ConversationStatus.updated_at.desc()).first()

        if not status:
            # Cria novo status se não existir
            status = ConversationStatus(
                tenant_id=tenant.id,
                patient_phone=from_number,  # temporário
                human_mode_active=True,
                human_mode_until=datetime.utcnow() + timedelta(hours=24)
            )
            db.add(status)
        else:
            status.human_mode_active = True
            status.human_mode_until = datetime.utcnow() + timedelta(hours=24)
            status.updated_at = datetime.utcnow()

        db.commit()

        print(f"✅ MODO HUMANO ATIVADO para paciente {status.patient_phone} (por atendente)")

        # Broadcast para o dashboard (se estiver aberto)
        await broadcast({
            "type": "human_activated",
            "patient_phone": status.patient_phone,
            "message": body
        })

    except Exception as e:
        logger.error(f"Erro ao ativar modo humano: {e}")
    finally:
        db.close()