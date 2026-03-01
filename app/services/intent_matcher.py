from typing import Optional
import unicodedata
import re



def normalize_text(text: str) -> str:
    """Normaliza o texto: remove acentos, converte para minúsculo e limpa"""
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]', '', text)  # remove caracteres especiais
    return text

COMMON_INTENTS = {
    # Saudação
    "oi": "Olá! Bem-vindo(a) à {clinic_name} 🦷\n\nComo posso ajudar hoje?",
    "olá": "Olá! Bem-vindo(a) à {clinic_name} 🦷\n\nComo posso ajudar hoje?",
    "bom dia": "Bom dia! Como posso ajudar hoje?",
    "boa tarde": "Boa tarde! Como posso ajudar hoje?",
    "olá": "Olá! Bem-vindo(a) à {clinic_name} 🦷\n\nComo posso ajudar hoje?",
    "boa noite": "Boa noite! Como posso ajudar hoje?",
    "oii": "Olá! Bem-vindo(a) à {clinic_name} 🦷\n\nComo posso ajudar hoje?",
    "e aí": "Olá! Bem-vindo(a) à {clinic_name} 🦷\n\nComo posso ajudar hoje?",
    

    # Preços comuns
    "quanto custa aparelho": "Aparelho fixo a partir de R$ 1.200\nAparelho estético a partir de R$ 1.800\nQuer agendar uma avaliação para saber o valor exato do seu caso?",
    "preço aparelho": "Aparelho fixo a partir de R$ 1.200\nAparelho estético a partir de R$ 1.800\nQuer agendar uma avaliação?",
    "quanto custa clareamento": "Clareamento a partir de R$ 650\nQuer agendar uma avaliação?",
    "preço clareamento": "Clareamento a partir de R$ 650\nQuer agendar uma avaliação?",
    "quanto custa extração": "Extração a partir de R$ 300\nQuer agendar uma avaliação?",
    "preço extração": "Extração a partir de R$ 300\nQuer agendar uma avaliação?",
    "quanto custa canal": "Tratamento de canal a partir de R$ 800\nQuer agendar uma avaliação?",
    "preço canal": "Tratamento de canal a partir de R$ 800\n    Quer agendar uma avaliação?",
    "quanto custa avaliação": "Avaliação com o Dr(a). {dentist_name} custa R$ 150\nQuer agendar uma avaliação?",
    "preço avaliação": "Avaliação com o Dr(a). {dentist_name} custa R$ 150\nQuer agendar uma avaliação?",
    "quanto custa consulta": "Avaliação com o Dr(a). {dentist_name} custa R$ 150\nQuer agendar uma avaliação?",
    "preço consulta": "Avaliação com o Dr(a). {dentist_name} custa R$ 150\nQuer agendar uma avaliação?",

    # Agendamento
    "quero agendar": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "marcar consulta": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "agendar avaliação": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "quero marcar avaliação": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "quero marcar consulta": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "marcar avaliação": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "marcar consulta": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "quero avaliação": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "quero consulta": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",
    "agendar consulta": "Ótimo! Para agendar sua avaliação, qual seu nome completo?",

    # Urgência
    "estou com dor": "Entendi! Dor merece prioridade. Qual seu nome completo para eu passar imediatamente para a atendente humana?",
    "dor de dente": "Entendi! Dor merece prioridade. Qual seu nome completo para eu passar imediatamente para a atendente humana?",
    "urgência": "Entendi! Urgência tem prioridade. Qual seu nome completo?",
    "sinto dor": "Entendi! Dor merece prioridade. Qual seu nome completo para eu passar imediatamente para a atendente humana?",
    "estou com dor de dente": "Entendi! Dor merece prioridade. Qual seu nome completo para eu passar imediatamente para a atendente humana?",
    "estou sentindo dor": "Entendi! Dor merece prioridade. Qual seu nome completo para eu passar imediatamente para a atendente humana?",

    # Falar com humano
    "atendente": "Entendido! Vou transferir você agora para nossa atendente humana.",
    "humano": "Entendido! Vou transferir você agora para nossa atendente humana.",
    "quero falar com alguém": "Entendido! Vou transferir você agora para nossa atendente humana.",
    "falar com alguém": "Entendido! Vou transferir você agora para nossa atendente humana.",
    "falar com a recepcionista": "Entendido! Vou transferir você agora para nossa atendente humana.",
    "não quero robô": "Entendido! Vou transferir você agora para nossa atendente humana.",
    "quero humano": "Entendido! Vou transferir você agora para nossa atendente humana."
}

def get_quick_response(message: str, tenant_name: str) -> Optional[str]:
    """Retorna resposta pronta se encontrar correspondência"""
    normalized = normalize_text(message)
    
    for key, response in COMMON_INTENTS.items():
        if key in normalized:
            return response.format(clinic_name=tenant_name)
    
    return None