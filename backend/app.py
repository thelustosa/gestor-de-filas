from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from websocket import ws_manager
from routes import news, queue, admin

app = FastAPI(title="API de Notícias - Google News")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Endpoint
@app.websocket("/ws/senhas")
async def websocket_endpoint(websocket: WebSocket, guiche: str = "TV", client_id: str = "TV", categoria: str = ""):
    await ws_manager.connect(websocket, guiche, client_id, categoria)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        ws_manager.disconnect(websocket)

# Include Routers
app.include_router(news.router)
app.include_router(queue.router)
app.include_router(admin.router)
