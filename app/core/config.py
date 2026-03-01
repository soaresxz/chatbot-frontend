from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_NUMBER: str          # sandbox ou número oficial (ex: +14155238886)
    GEMINI_API_KEY: str
    SECRET_KEY: str = "odontoia-secret-key-mude-em-producao-2026"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()