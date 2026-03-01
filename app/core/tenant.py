from contextvars import ContextVar
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.database import SessionLocal
from app.models.tenant import Tenant

current_tenant_id = ContextVar("current_tenant_id", default=None)

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Para webhook do Twilio, identificamos pelo número que recebeu a mensagem
        if "/twilio/webhook" in request.url.path:
            try:
                body = await request.form()          # Twilio envia como form
                to_number = str(body.get("To", "")).replace("whatsapp:", "")
                
                db = SessionLocal()
                tenant = db.query(Tenant).filter(
                    Tenant.whatsapp_number == to_number
                ).first()
                db.close()

                if tenant:
                    token = current_tenant_id.set(tenant.id)
                    request.state.tenant_id = tenant.id
                    request.state.tenant = tenant
                    response = await call_next(request)
                    current_tenant_id.reset(token)
                    return response
            except:
                pass  # ignora se não conseguir ler

        # Para rotas da dashboard (futuro) usaremos header
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            request.state.tenant_id = tenant_id

        return await call_next(request)