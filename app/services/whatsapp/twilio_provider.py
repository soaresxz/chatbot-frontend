from twilio.rest import Client
from app.services.whatsapp.provider import WhatsAppProvider
from app.core.config import settings

class TwilioProvider(WhatsAppProvider):
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # Sandbox TWILIO SEMPRE envia de +14155238886
        self.from_number = "14155238886"  # ← número oficial do Sandbox (sem +)

    async def send_message(self, to: str, body: str) -> str:
        to_clean = to.replace("whatsapp:", "").replace("+", "").strip()
        
        message = self.client.messages.create(
            from_=f"whatsapp:{self.from_number}",
            body=body,
            to=f"whatsapp:{to_clean}"
        )
        return message.sid