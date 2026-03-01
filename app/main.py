from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import os

from app.core.database import create_tables
from app.api.v1.webhook import router as webhook_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.send_message import router as send_router
from app.api.v1.human_send import router as human_send_router
from app.core.websocket_manager import active_connections
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.conversations import router as conversations_router

app = FastAPI(
    title="OdontoIA SaaS",
    description="Plataforma multi-clínica de chatbot WhatsApp para odontologia",
    version="1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware leve de log (pode remover em produção)
class SimpleRequestMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        print(f"[REQUEST] {request.method} {request.url.path}")
        response = await call_next(request)
        print(f"[RESPONSE] {response.status_code} {request.url.path}")
        return response

app.add_middleware(SimpleRequestMiddleware)

# ================== ADMIN PANEL - SaaS (Seguro) ==================
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
if not ADMIN_API_KEY:
    raise RuntimeError("ADMIN_API_KEY não configurada no Railway!")

def verify_admin_key(api_key: str = Query(None, alias="api_key")):
    if not api_key or api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Chave de admin inválida")
    return True

# Criar nova clínica
@app.get("/admin/create-tenant")
def create_tenant(
    name: str = Query(...),
    dentist_name: str = Query(...),
    whatsapp_number: str = Query(...),
    plan: str = Query("basic"),
    api_key: bool = Depends(verify_admin_key),
    db: Session = Depends(get_db)
):
    from app.models.tenant import Tenant
    from sqlalchemy.orm import Session
    from app.core.database import get_db

    if db.query(Tenant).filter(Tenant.whatsapp_number == whatsapp_number).first():
        raise HTTPException(400, "Número de WhatsApp já cadastrado")

    new_tenant = Tenant(
        id=f"clinica_{name.lower().replace(' ', '_').replace('ã','a').replace('ç','c')}",
        name=name,
        dentist_name=dentist_name,
        whatsapp_number=whatsapp_number,
        plan=plan,
        is_active=True,
        human_mode_active=False
    )

    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    return {
        "status": "success",
        "message": f"Clínica '{name}' criada com sucesso!",
        "tenant_id": new_tenant.id,
        "whatsapp_number": new_tenant.whatsapp_number,
        "plan": new_tenant.plan
    }

# Listar clínicas
@app.get("/admin/tenants")
def list_tenants(api_key: bool = Depends(verify_admin_key), db: Session = Depends(get_db)):
    from app.models.tenant import Tenant
    tenants = db.query(Tenant).all()
    return {
        "total": len(tenants),
        "clinicas": [{
            "id": t.id,
            "nome": t.name,
            "dentista": t.dentist_name,
            "whatsapp": t.whatsapp_number,
            "plano": t.plan,
            "ativo": t.is_active
        } for t in tenants]
    }

# ================== ROTAS PRINCIPAIS ==================
app.include_router(webhook_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/dashboard")
app.include_router(send_router, prefix="/api")
app.include_router(human_send_router, prefix="/api")
app.include_router(conversations_router, prefix="/api/v1")

# WebSocket
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.discard(websocket)

# Startup
@app.on_event("startup")
def startup_event():
    create_tables()
    print("🚀 OdontoIA SaaS iniciado com sucesso!")

# Root
@app.get("/")
async def root():
    return {"status": "online", "version": "1.0", "saas": "multi-clínica"}