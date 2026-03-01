from abc import ABC, abstractmethod

class WhatsAppProvider(ABC):
    @abstractmethod
    async def send_message(self, to: str, body: str) -> str:
        """Envia mensagem e retorna o SID"""
        pass