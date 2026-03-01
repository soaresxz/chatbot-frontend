from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.message_log import MessageLog
from app.services.whatsapp.twilio_provider import TwilioProvider
from app.services.whatsapp.service import broadcast
from uuid import uuid4
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/human-send")
async def human_send(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
    except:
        raise HTTPException(status_code=400, detail="JSON inválido")

    phone = data.get("phone") or data.get("phoneNumber") or data.get("patientPhone") or data.get("to")
    message = data.get("message") or data.get("text") or data.get("body")

    if not phone or not message:
        raise HTTPException(status_code=422, detail="phone e message são obrigatórios")

    logger.info(f"[HUMANO SEND] Recebido → Phone: {phone} | Msg: {message[:80]}...")

    # === SALVA NO BANCO (agora não some mais no reload) ===
    message_log = MessageLog(
        id=str(uuid4()),
        tenant_id="clinica-teste-aracaju",   # ← tenant que você criou no seed
        from_phone="humano",                 # ou o número da atendente se quiser
        to_phone=phone,
        message=message,
        direction="out"
    )
    db.add(message_log)
    db.commit()
    db.refresh(message_log)

    # === ENVIO PARA WHATSAPP ===
    try:
        provider = TwilioProvider()
        phone_clean = phone.replace("whatsapp:", "").replace(" ", "").strip()
        if not phone_clean.startswith("+"):
            phone_clean = "+" + phone_clean
        full_to = f"whatsapp:{phone_clean}"

        sid = await provider.send_message(full_to, message)

        # Broadcast em tempo real
        await broadcast({
            "type": "new_message",
            "from": "humano",
            "to": phone,
            "message": message,
            "is_bot": False,
            "sid": sid,
            "direction": "out"
        })

        logger.info(f"[HUMANO SEND] ✅ Salvo + Enviado! SID: {sid}")
        return {"status": "success", "sid": sid}

    except Exception as e:
        logger.error(f"[HUMANO SEND] ERRO: {e}")
        raise HTTPException(status_code=500, detail=str(e))