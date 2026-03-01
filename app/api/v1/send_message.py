from fastapi import APIRouter, Body

router = APIRouter()

@router.post("/send")
async def send_human_message(phone: str = Body(...), message: str = Body(...)):
    print("=== LOVABLE CHAMOU O ENDPOINT ===")
    print(f"Phone recebido: {phone}")
    print(f"Mensagem recebida: {message}")
    print("=== FIM DO TESTE ===")
    
    return {
        "status": "success",
        "message": "Mensagem recebida pelo backend (teste mínimo)"
    }