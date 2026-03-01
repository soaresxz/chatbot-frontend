from fastapi import WebSocket
from typing import Set

# Gerenciador global (usado por main.py, service.py e human_send)
active_connections: Set[WebSocket] = set()

async def broadcast(message: dict):
    """Envia mensagem em tempo real para o dashboard do Lovable"""
    if not active_connections:
        print("⚠️ Nenhuma conexão WebSocket ativa")
        return

    print(f"📢 Broadcasting: {message.get('type')} para {len(active_connections)} conexões")

    dead = []
    for conn in active_connections.copy():
        try:
            await conn.send_json(message)
        except:
            dead.append(conn)
    for d in dead:
        active_connections.discard(d)