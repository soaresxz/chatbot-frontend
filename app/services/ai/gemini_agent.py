import google.generativeai as genai
from app.utils.prompts import ODONTO_PROMPT
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.service import Service

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

conversation_history = {}

async def get_services_list(tenant_id: str) -> str:
    db = SessionLocal()
    services = db.query(Service).filter(
        Service.tenant_id == tenant_id,
        Service.is_active == True
    ).all()
    db.close()

    if not services:
        return "Serviços sob consulta (vamos avaliar seu caso)."

    lines = []
    for s in services:
        lines.append(f"- {s.name}: a partir de R$ {float(s.price_from):,.2f}".replace(",", "."))
    return "\n".join(lines)

async def get_ai_response(message: str, tenant, phone: str) -> str:
    if phone not in conversation_history:
        conversation_history[phone] = []

    conversation_history[phone].append(f"Paciente: {message}")
    if len(conversation_history[phone]) > 10:
        conversation_history[phone] = conversation_history[phone][-10:]

    history = "\n".join(conversation_history[phone])

    services_text = await get_services_list(tenant.id)

    prompt = ODONTO_PROMPT.format(
        clinic_name=tenant.name,
        dentist_name=tenant.dentist_name,
        services_list=services_text
    )

    full_prompt = f"{prompt}\n\nHistórico:\n{history}\n\nResponda direto:"

    response = model.generate_content(full_prompt)
    ai_text = response.text.strip()

    conversation_history[phone].append(f"Luna: {ai_text}")
    return ai_text