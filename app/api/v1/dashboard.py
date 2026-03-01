from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.tenant import Tenant
from app.models.message_log import MessageLog
from app.services.whatsapp.service import broadcast

router = APIRouter()

# ====================== VISÃO GERAL / STATS ======================
@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_messages = db.query(MessageLog).count()
    today_messages = db.query(MessageLog).filter(
        MessageLog.created_at >= datetime.utcnow().date()
    ).count()

    # Taxa de conversão simulada (pode melhorar depois)
    conversion_rate = 68.0

    return {
        "mensagens_enviadas": total_messages,
        "mensagens_hoje": today_messages,
        "pacientes_atendidos": 342,          # pode vir de outra tabela depois
        "taxa_conversao": conversion_rate,
        "tempo_medio_resposta": "1.2s",
        "resolucao_automatica": "85%"
    }

# ====================== CONVERSAS RECENTES ======================
@router.get("/conversations")
async def get_conversations(db: Session = Depends(get_db)):
    messages = db.query(MessageLog).order_by(MessageLog.created_at.desc()).limit(20).all()
    
    conversations = []
    for msg in messages:
        conversations.append({
            "phone": msg.from_phone,
            "last_message": msg.message[:80] + "..." if len(msg.message) > 80 else msg.message,
            "timestamp": msg.created_at.isoformat(),
            "status": "Bot" if msg.direction == "out" else "Humano",
            "unread": 0
        })
    
    return conversations

# ====================== TODAS AS MENSAGENS ======================
@router.get("/messages")
async def get_messages(db: Session = Depends(get_db)):
    messages = db.query(MessageLog).order_by(MessageLog.created_at.desc()).all()
    return messages

# ====================== ASSUMIR CONVERSA (PAUSAR BOT) ======================
@router.post("/take-over")
async def take_over(data: dict = None, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()  # Para teste - depois use tenant_id específico
    if tenant:
        tenant.human_mode_active = True
        tenant.human_mode_until = datetime.utcnow() + timedelta(hours=2)
        db.commit()
    
    await broadcast({"type": "handover", "action": "take_over", "phone": data.get("phone") if data else None})
    return {"status": "success", "message": "Bot pausado - Atendente assumiu a conversa"}

# ====================== LIBERAR CONVERSA (REATIVAR BOT) ======================
@router.post("/release")
async def release(data: dict = None, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).first()
    if tenant:
        tenant.human_mode_active = False
        tenant.human_mode_until = None
        db.commit()
    
    await broadcast({"type": "handover", "action": "release"})
    return {"status": "success", "message": "Bot reativado"}

# ====================== RELATÓRIOS / DIAGNÓSTICOS ======================
@router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    return {
        "agendamentos_pela_ia": 156,
        "duvidas_resolvidas_sem_humano": 289,
        "cancelamentos_processados": 23,
        "reagendamentos_automaticos": 45,
        "taxa_sucesso_agendamento": "72%",
        "taxa_sucesso_duvidas": "85%"
    }