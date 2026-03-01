from collections import defaultdict
from datetime import datetime, timedelta
import re

# Estado independente por número de telefone
user_state = defaultdict(lambda: {
    "step": "new",
    "data": {},
    "paused_until": None
})

PAUSE_HOURS = 24

# ─── Helpers ────────────────────────────────────────────────────────────────

def main_menu(tenant_name: str) -> str:
    return (
        f"👋 *Bem-vindo(a) à {tenant_name}!* 🦷\n\n"
        "Como posso te ajudar?\n\n"
        "1️⃣ Agendar Avaliação\n"
        "2️⃣ Ver Preços\n"
        "3️⃣ Urgência / Dor\n"
        "4️⃣ Falar com Atendente\n\n"
        "_(Digite o número da opção ou a palavra chave)_"
    )

def handoff_message() -> str:
    return (
        "✅ Estou passando você para nossa atendente agora.\n\n"
        "Ela responderá em instantes! 😊\n"
        "Horário de atendimento: *seg–sex, 8h–18h*"
    )

def pause_bot(state: dict):
    state["step"] = "em_atendimento_humano"
    state["paused_until"] = datetime.now() + timedelta(hours=PAUSE_HOURS)

def check_pause(state: dict) -> bool:
    if state["step"] != "em_atendimento_humano":
        return False
    if state["paused_until"] is None:
        return False
    if datetime.now() >= state["paused_until"]:
        state["step"] = "main_menu"
        state["paused_until"] = None
        print(f"🤖 Pausa expirada para {state}, reativando.")  # Debug
        return False
    print(f"🤖 Bot pausado até {state['paused_until']}")  # Debug
    return True

def reset(state: dict, tenant_name: str) -> str:
    state["step"] = "main_menu"
    state["data"] = {}
    return main_menu(tenant_name)

def validate_date(text: str) -> bool | datetime:
    match = re.match(r"(\d{1,2})[/.](\d{1,2})", text)
    if not match:
        return False
    day, month = map(int, match.groups())
    current_year = datetime.now().year
    try:
        dt = datetime(current_year, month, day)
        if dt < datetime.now():
            dt = datetime(current_year + 1, month, day)
        return dt
    except ValueError:
        return False

# ─── Handler principal ───────────────────────────────────────────────────────

async def handle_basic_plan(body: str, from_number: str, tenant) -> str | None:
    raw = body.strip()
    text = raw.lower()
    state = user_state[from_number]

    if check_pause(state):
        return None

    GREETINGS = {"oi", "olá", "ola", "oii", "bom dia", "boa tarde", "boa noite", "eai", "eae", "tudo bem"}
    MENU_CMDS = {"menu", "voltar", "inicio", "início", "0"}

    if text in GREETINGS | MENU_CMDS or state["step"] == "new":
        return reset(state, tenant.name)

    if state["step"] == "esperando_nome":
        if len(raw) < 4 or not any(c.isalpha() for c in raw):
            return "Por favor, digite seu *nome completo* válido. Ex: _Maria Silva_"
        state["data"]["nome"] = raw.title()
        state["step"] = "esperando_data"
        return (
            f"Perfeito, *{state['data']['nome']}*! 😊\n\n"
            "Qual dia prefere? Use formato *DD/MM*.\n"
            "_(Ex: 15/03 para 15 de março)_\n\n"
            "E o período? _(manhã, tarde ou noite)_"
        )

    if state["step"] == "esperando_data":
        parsed_date = validate_date(text)
        if not parsed_date:
            return (
                "Data inválida 😅\n\n"
                "Use formato *DD/MM* (ex: 15/03).\n"
                "E o período: manhã, tarde ou noite."
            )
        periodo = "indefinido"
        if any(w in text for w in ["manhã", "manha"]):
            periodo = "manhã"
        elif any(w in text for w in ["tarde"]):
            periodo = "tarde"
        elif any(w in text for w in ["noite"]):
            periodo = "noite"
        
        state["data"]["data"] = parsed_date.strftime("%d/%m/%Y")
        state["data"]["periodo"] = periodo
        state["step"] = "aguardando_confirmacao"
        return (
            "Confirme os dados:\n\n"
            f"👤 Nome: *{state['data']['nome']}*\n"
            f"📅 Data: *{state['data']['data']}*\n"
            f"⏰ Período: *{state['data']['periodo']}*\n\n"
            "Está correto? *(sim / não)*"
        )

    if state["step"] == "aguardando_confirmacao":
        affirmatives = {"sim", "ok", "isso", "correto", "certo", "pode", "yes", "blz", "beleza", "confirmo"}
        negatives = {"não", "nao", "errado", "errei", "corrigir", "no"}
        
        if any(w in text for w in affirmatives):
            nome = state["data"]["nome"]
            data = state["data"]["data"]
            periodo = state["data"]["periodo"]
            state["data"]["solicitado_em"] = datetime.now().strftime("%d/%m/%Y %H:%M")
            pause_bot(state)
            return (
                f"✅ *Agendamento solicitado!*\n\n"
                f"👤 {nome}\n"
                f"📅 {data} ({periodo})\n\n"
                + handoff_message()
            )
        elif any(w in text for w in negatives):
            state["step"] = "esperando_nome"
            state["data"] = {}
            return "Tudo bem! Vamos corrigir.\n\nDigite seu *nome completo*:"
        else:
            return "Responda *sim* para confirmar ou *não* para corrigir."

    if state["step"] == "esperando_resposta_precos":
        affirmatives = {"sim", "quero", "vou", "agendar", "marcar", "pode", "yes"}
        if any(w in text for w in affirmatives):
            state["step"] = "esperando_nome"
            return "✅ Ótimo! Digite seu *nome completo* para agendar:"
        else:
            return reset(state, tenant.name) + "\n\nEntendido! 😊 Se precisar de algo, é só chamar."

    if any(kw in text for kw in ["1", "agendar", "marcar", "avaliação", "avaliacao", "quero agendar"]):
        state["step"] = "esperando_nome"
        return "📋 Vamos agendar!\n\nDigite seu *nome completo*:"

    if any(kw in text for kw in ["2", "preco", "preços", "precos", "valor", "valores", "quanto custa"]):
        state["step"] = "esperando_resposta_precos"
        return (
            "💰 Valores *a partir de*:\n\n"
            "🦷 Limpeza → R$ 180\n"
            "✨ Clareamento → R$ 650\n"
            "🔧 Aparelho Fixo → R$ 1.200\n"
            "💎 Aparelho Estético → R$ 1.800\n"
            "🪮 Faceta → R$ 850\n"
            "🔩 Implante → R$ 2.500\n"
            "🩺 Canal + Coroa → R$ 950\n\n"
            "_Os valores podem variar conforme avaliação._\n\n"
            "Quer agendar uma avaliação para saber o valor exato? *(sim / não)*"
        )

    if any(kw in text for kw in ["3", "urgencia", "urgência", "dor", "siso", "inchaço", "inchaco", "tô com dor", "to com dor"]):
        pause_bot(state)
        return (
            "😣 Entendido! Urgência tem prioridade total.\n\n"
            + handoff_message()
        )

    if any(kw in text for kw in ["4", "atendente", "humano", "pessoa", "falar", "quero falar"]):
        pause_bot(state)
        return handoff_message()

    return (
        "Não entendi 😅\n\n"
        + main_menu(tenant.name)
    )