import dateparser
from datetime import datetime, timedelta
import re

def parse_brazilian_date_time(text: str):
    """
    Converte frases em português para data e hora reais
    Exemplos que funcionam:
    - "dia 15 de março às 14h"
    - "amanhã às 9h30"
    - "próxima terça às 10h"
    - "15/03 às 14:30"
    - "quinta que vem 15h"
    """
    # Configurações específicas para português brasileiro
    settings = {
        'PREFER_DATES_FROM': 'future',
        'RETURN_AS_TIMEZONE_AWARE': False,
        'PREFER_DAY_OF_MONTH': 'first',
        'NORMALIZE': True,
        'DATE_ORDER': 'DMY'
    }

    # Tenta parse direto
    parsed = dateparser.parse(text, languages=['pt'], settings=settings)
    
    if not parsed:
        # Tenta limpar o texto
        cleaned = re.sub(r'(dia|às|as|horas?|h)', '', text, flags=re.IGNORECASE).strip()
        parsed = dateparser.parse(cleaned, languages=['pt'], settings=settings)

    if parsed:
        return {
            "date": parsed.date(),
            "time": parsed.time(),
            "full_datetime": parsed,
            "date_str": parsed.strftime("%d/%m/%Y"),   # formato da sua planilha
            "time_str": parsed.strftime("%H:%M")
        }
    
    return None