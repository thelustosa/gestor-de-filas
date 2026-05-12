from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict

class ConnectionManager:
    def __init__(self):
        # socket: {"guiche": str, "client_id": str}
        self.active_connections: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, guiche: str, client_id: str, categoria: str = ""):
        await websocket.accept()
        self.active_connections[websocket] = {
            "guiche": guiche, 
            "client_id": client_id,
            "categoria": categoria
        }

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    def guiche_esta_online(self, guiche: str, current_client_id: str = None) -> bool:
        for info in self.active_connections.values():
            if info["guiche"] == guiche:
                # Se for o mesmo cliente (ex: refresh), não considera ocupado
                if current_client_id and info["client_id"] == current_client_id:
                    continue
                return True
        return False

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections.keys()):
            try:
                await connection.send_json(message)
            except:
                self.disconnect(connection)

ws_manager = ConnectionManager()
