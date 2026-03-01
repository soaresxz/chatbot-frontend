from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.models.message_log import MessageLog
from app.models.tenant import Tenant
from app.models.conversation_status import ConversationStatus
from datetime import datetime

router = APIRouter(prefix="/conversations")

# ================== LISTAR CONVERSAS AGRUPADAS POR PACIENTE ==================
@router.get("")
def list_conversations(
    tenant_id: str,
    api_key: str = Query(...),
    db: Session = Depends(get_db)
):
    # Verifica tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(404, "Clínica não encontrada")

    # Pega todas as conversas desse tenant
    conversations = (
        db.query(MessageLog)
        .filter(MessageLog.tenant_id == tenant_id)
        .order_by(desc(MessageLog.created_at))
        .all()
    )

    # Agrupa por paciente
    from collections import defaultdict
    grouped = defaultdict(list)

    for msg in conversations:
        patient_phone = msg.from_phone if msg.direction == "in" else msg.to_phone
        grouped[patient_phone].append(msg)

    result = []
    for phone, msgs in grouped.items():
        last_msg = msgs[0]
        result.append({
            "patient_phone": phone,
            "last_message": last_msg.message,
            "last_message_time": last_msg.created_at.isoformat(),
            "direction": last_msg.direction,
            "unread": 0,  # podemos melhorar depois
            "human_mode": False
        })

    return {"conversations": result}

# ================== BUSCAR MENSAGENS DE UM PACIENTE ESPECÍFICO ==================
@router.get("/{patient_phone}")
def get_conversation(
    patient_phone: str,
    tenant_id: str,
    api_key: str = Query(...),
    db: Session = Depends(get_db)
):
    messages = (
        db.query(MessageLog)
        .filter(
            MessageLog.tenant_id == tenant_id,
            (MessageLog.from_phone == patient_phone) | (MessageLog.to_phone == patient_phone)
        )
        .order_by(MessageLog.created_at)
        .all()
    )

    return {
        "patient_phone": patient_phone,
        "messages": [
            {
                "id": m.id,
                "message": m.message,
                "direction": m.direction,   # "in" = paciente | "out" = bot
                "created_at": m.created_at.isoformat()
            } for m in messages
        ]
    }

# ================== ASSUMIR CONVERSA (MODO HUMANO) ==================
@router.post("/assume")
def assume_conversation(
    patient_phone: str,
    tenant_id: str,
    api_key: str = Query(...),
    db: Session = Depends(get_db)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(404, "Clínica não encontrada")

    # Ativa modo humano
    status = db.query(ConversationStatus).filter(
        ConversationStatus.tenant_id == tenant_id,
        ConversationStatus.patient_phone == patient_phone
    ).first()

    if not status:
        status = ConversationStatus(
            tenant_id=tenant_id,
            patient_phone=patient_phone,
            human_mode_active=True,
            human_mode_until=datetime.utcnow().replace(year=2030)  # até 2030 = indefinido
        )
        db.add(status)
    else:
        status.human_mode_active = True
        status.human_mode_until = datetime.utcnow().replace(year=2030)

    db.commit()

    return {"status": "success", "message": "✅ Conversa assumida com sucesso! Agora você pode responder pelo dashboard."}