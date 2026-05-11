import os
import json
import asyncio
import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

app = FastAPI(title="API de Notícias AGR")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
#   WEBSOCKET MANAGER
# ─────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # socket: {"guiche": str, "client_id": str}
        self.active_connections: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, guiche: str, client_id: str):
        await websocket.accept()
        self.active_connections[websocket] = {"guiche": guiche, "client_id": client_id}

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

@app.websocket("/ws/senhas")
async def websocket_endpoint(websocket: WebSocket, guiche: str = "TV", client_id: str = "TV"):
    await ws_manager.connect(websocket, guiche, client_id)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        ws_manager.disconnect(websocket)

# ─────────────────────────────────────────
#   NOTICIAS (Async & Cache)
# ─────────────────────────────────────────

NEWS_CACHE = {
    "data": [],
    "last_update": None
}
CACHE_TTL = timedelta(minutes=15)

async def extrair_dados_agr_async() -> List[Dict[str, str]]:
    url = "https://goias.gov.br/agr/categoria/noticias/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        noticias = []
        artigos = soup.find_all('article', class_='tease')
        if not artigos:
            artigos = soup.find_all('article')
            
        for artigo in artigos:
            titulo_tag = artigo.select_one('h2.entry-title a') or artigo.find('h2') or artigo.find('a')
            if not titulo_tag: continue
            
            titulo = titulo_tag.get_text(strip=True)
            link_noticia = titulo_tag.get('href')
            img_tag = artigo.find('img')
            link_imagem = None
            
            if img_tag:
                link_imagem = (img_tag.get('data-src') or img_tag.get('data-lazy-src') or img_tag.get('src'))
                if not link_imagem or "data:image" in link_imagem:
                    srcset = img_tag.get('srcset')
                    if srcset:
                        link_imagem = srcset.split(',')[0].split(' ')[0]
                    else:
                        noscript = artigo.find('noscript')
                        if noscript:
                            img_noscript = noscript.find('img')
                            if img_noscript:
                                link_imagem = img_noscript.get('src')
                                
            if link_imagem and link_imagem.startswith('/'): link_imagem = f"https://goias.gov.br{link_imagem}"
            if link_noticia and link_noticia.startswith('/'): link_noticia = f"https://goias.gov.br{link_noticia}"
            
            noticias.append({
                "titulo": titulo,
                "link": link_noticia if link_noticia else "#",
                "imagem": link_imagem if link_imagem else "https://via.placeholder.com/400x200?text=Sem+Imagem"
            })
        return noticias
    except Exception as e:
        print(f"Erro na extração async: {e}")
        return []

@app.get("/noticias")
async def listar_noticias():
    """Retorna notícias da AGR com cache para não banir o IP."""
    agora = datetime.now()
    if NEWS_CACHE["data"] and NEWS_CACHE["last_update"]:
        if agora - NEWS_CACHE["last_update"] < CACHE_TTL:
            return NEWS_CACHE["data"]
            
    novas_noticias = await extrair_dados_agr_async()
    if novas_noticias:
        NEWS_CACHE["data"] = novas_noticias
        NEWS_CACHE["last_update"] = agora
        return novas_noticias
        
    return NEWS_CACHE["data"]

# ─────────────────────────────────────────
#   SISTEMA DE SENHAS & PERSISTÊNCIA
# ─────────────────────────────────────────

CATEGORIAS = {
    'O': 'Ouvidoria',
    'F': 'Finanças',
    'C': 'Cadastro de Veículos e Empresas',
    'P': 'Protocolar Documentos',
}

STATE_FILE = "estado_filas.json"

class Senha:
    def __init__(self, id: str, categoria: str, tipo: str = 'N'):
        self.id = id
        self.categoria = categoria
        self.tipo = tipo
        self.preferencial = (tipo == 'P')
        self.guiche: Optional[str] = None
        self.horario_emissao: str = datetime.now().isoformat()
        self.horario_chamada: Optional[str] = None
        self.horario_finalizacao: Optional[str] = None
        self.tempo_espera_seg: Optional[int] = None
        self.tempo_atendimento_seg: Optional[int] = None
        self.observacao: Optional[str] = None
        self.status: str = "aguardando" 

    def to_dict(self):
        return {
            "id": self.id,
            "categoria": self.categoria,
            "tipo": self.tipo,
            "preferencial": self.preferencial,
            "categoria_nome": CATEGORIAS.get(self.categoria, self.categoria),
            "guiche": self.guiche,
            "horario_emissao": self.horario_emissao,
            "horario_chamada": self.horario_chamada,
            "horario_finalizacao": self.horario_finalizacao,
            "tempo_espera_seg": self.tempo_espera_seg,
            "tempo_atendimento_seg": self.tempo_atendimento_seg,
            "observacao": self.observacao,
            "status": self.status,
        }

    @classmethod
    def from_dict(cls, data):
        s = cls(data['id'], data['categoria'], data.get('tipo', 'N'))
        s.__dict__.update(data)
        # Sempre recalcular preferencial a partir do tipo
        s.preferencial = (s.tipo == 'P')
        return s

class FilaEstado:
    def __init__(self):
        # contadores agora terão a chave como categoria + tipo (ex: 'FN', 'FP')
        self.contadores: Dict[str, int] = {}
        for c in CATEGORIAS:
            self.contadores[f"{c}N"] = 0
            self.contadores[f"{c}P"] = 0
        self.filas: Dict[str, List[Senha]] = {k: [] for k in CATEGORIAS}
        self.senhas_ativas: Dict[str, Senha] = {}
        self.senhas_finalizadas: Dict[str, List[Senha]] = {k: [] for k in CATEGORIAS}
        self.historico_tv: List[dict] = []
        self.load()

    def save(self):
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            data = {
                "contadores": self.contadores,
                "filas": {k: [s.to_dict() for s in v] for k, v in self.filas.items()},
                "senhas_ativas": {k: v.to_dict() for k, v in self.senhas_ativas.items()},
                "senhas_finalizadas": {k: [s.to_dict() for s in v] for k, v in self.senhas_finalizadas.items()},
                "historico_tv": self.historico_tv
            }
            json.dump(data, f, ensure_ascii=False)

    def load(self):
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    contadores_raw = data.get("contadores", {})
                    # Migrar contadores antigos de 1 caractere para o novo formato
                    for k, v in contadores_raw.items():
                        if len(k) == 2:  # Formato novo (ex: 'FN', 'FP')
                            self.contadores[k] = v
                        # Ignora contadores de 1 caractere (formato antigo)
                    
                    for k, v in data.get("filas", {}).items():
                        if k in self.filas:
                            self.filas[k] = [Senha.from_dict(s) for s in v]
                        
                    for k, v in data.get("senhas_ativas", {}).items():
                        self.senhas_ativas[k] = Senha.from_dict(v)
                        
                    for k, v in data.get("senhas_finalizadas", {}).items():
                        if k in self.senhas_finalizadas:
                            self.senhas_finalizadas[k] = [Senha.from_dict(s) for s in v]
                        
                    self.historico_tv = data.get("historico_tv", [])
            except Exception as e:
                print(f"Erro ao carregar estado: {e}")

estado = FilaEstado()

# ─── Models de Request ───
class GerarSenhaRequest(BaseModel): 
    categoria: str
    tipo: str = 'N'  # 'N' para Normal, 'P' para Preferencial
class ChamarRequest(BaseModel): categoria: str; guiche: str
class RechamarRequest(BaseModel): guiche: str
class FinalizarRequest(BaseModel): guiche: str
class ObservacaoRequest(BaseModel): senha_id: str; observacao: str
class HistoricoRechamarRequest(BaseModel): senha_id: str; guiche: str

def _calcular_segundos(inicio_iso: str, fim_iso: str) -> int:
    inicio = datetime.fromisoformat(inicio_iso)
    fim = datetime.fromisoformat(fim_iso)
    return max(0, int((fim - inicio).total_seconds()))

@app.post("/senha/gerar")
async def gerar_senha(req: GerarSenhaRequest):
    cat = req.categoria.upper()
    tipo = req.tipo.upper()
    if cat not in CATEGORIAS: cat = 'O'
    if tipo not in ['N', 'P']: tipo = 'N'
    
    chave_contador = f"{cat}{tipo}"
    if chave_contador not in estado.contadores:
        estado.contadores[chave_contador] = 0
        
    estado.contadores[chave_contador] += 1
    senha_id = f"{cat}{tipo}{estado.contadores[chave_contador]:03d}"
    nova = Senha(id=senha_id, categoria=cat, tipo=tipo)
    estado.filas[cat].append(nova)
    estado.save()
    await ws_manager.broadcast({"tipo": "FILA_ATUALIZADA"})
    return nova.to_dict()

@app.post("/senha/chamar")
async def chamar_senha(req: ChamarRequest):
    cat = req.categoria.upper()
    if cat not in estado.filas: raise HTTPException(status_code=400)
    fila = estado.filas[cat]
    if not fila: return {"erro": f"Nenhuma senha aguardando em {CATEGORIAS.get(cat, cat)}"}

    if req.guiche in estado.senhas_ativas:
        anterior = estado.senhas_ativas[req.guiche]
        if anterior.status == "chamada":
            agora = datetime.now().isoformat()
            anterior.status = "finalizada"
            anterior.horario_finalizacao = agora
            if anterior.horario_chamada:
                anterior.tempo_atendimento_seg = _calcular_segundos(anterior.horario_chamada, agora)
            # Salvar no histórico de finalizadas
            estado.senhas_finalizadas[anterior.categoria].insert(0, anterior)
            estado.senhas_finalizadas[anterior.categoria] = estado.senhas_finalizadas[anterior.categoria][:30]
            del estado.senhas_ativas[req.guiche]

    # Priorizar Preferenciais
    idx_proxima = 0
    for i, s in enumerate(fila):
        if s.preferencial:
            idx_proxima = i
            break

    proxima = fila.pop(idx_proxima)
    agora = datetime.now().isoformat()
    proxima.guiche = req.guiche
    proxima.status = "chamada"
    proxima.horario_chamada = agora
    if proxima.horario_emissao:
        proxima.tempo_espera_seg = _calcular_segundos(proxima.horario_emissao, agora)

    estado.senhas_ativas[req.guiche] = proxima
    estado.historico_tv.insert(0, {"senha": proxima.id, "guiche": req.guiche})
    estado.historico_tv = estado.historico_tv[:10]
    estado.save()
    
    # Broadcast the new password call
    await ws_manager.broadcast({"tipo": "NOVA_SENHA", "data": proxima.to_dict()})
    return proxima.to_dict()

@app.post("/senha/rechamar")
async def rechamar_senha(req: RechamarRequest):
    if req.guiche not in estado.senhas_ativas: return {"erro": "Nenhuma senha ativa neste guichê"}
    senha = estado.senhas_ativas[req.guiche]
    
    # Broadcast rechamada
    await ws_manager.broadcast({"tipo": "NOVA_SENHA", "data": senha.to_dict()})
    return senha.to_dict()

@app.post("/senha/finalizar")
async def finalizar_senha(req: FinalizarRequest):
    if req.guiche not in estado.senhas_ativas: return {"erro": "Nenhuma senha ativa"}
    senha = estado.senhas_ativas[req.guiche]
    if senha.status != "chamada": return {"erro": "Senha não está em atendimento"}
    
    agora = datetime.now().isoformat()
    senha.status = "finalizada"
    senha.horario_finalizacao = agora
    if senha.horario_chamada:
        senha.tempo_atendimento_seg = _calcular_segundos(senha.horario_chamada, agora)
        
    estado.senhas_finalizadas[senha.categoria].insert(0, senha)
    estado.senhas_finalizadas[senha.categoria] = estado.senhas_finalizadas[senha.categoria][:30] # Guarda 30 ultimas
    del estado.senhas_ativas[req.guiche]
    estado.save()
    await ws_manager.broadcast({"tipo": "FILA_ATUALIZADA"})
    return senha.to_dict()

@app.post("/senha/historico/rechamar")
async def historico_rechamar_senha(req: HistoricoRechamarRequest):
    # Se ja houver alguem em atendimento, finaliza primeiro
    if req.guiche in estado.senhas_ativas:
        anterior = estado.senhas_ativas[req.guiche]
        if anterior.status == "chamada":
            agora = datetime.now().isoformat()
            anterior.status = "finalizada"
            anterior.horario_finalizacao = agora
            if anterior.horario_chamada:
                anterior.tempo_atendimento_seg = _calcular_segundos(anterior.horario_chamada, agora)
            estado.senhas_finalizadas[anterior.categoria].insert(0, anterior)
            estado.senhas_finalizadas[anterior.categoria] = estado.senhas_finalizadas[anterior.categoria][:30]
            del estado.senhas_ativas[req.guiche]

    # Agora procura no historico e resgata
    for cat, senhas in estado.senhas_finalizadas.items():
        for i, s in enumerate(senhas):
            if s.id == req.senha_id:
                s_removida = senhas.pop(i)
                s_removida.status = "chamada"
                s_removida.guiche = req.guiche # Atualiza o guiche pro atendente que rechamou
                
                estado.historico_tv.insert(0, {"senha": s_removida.id, "guiche": req.guiche})
                estado.historico_tv = estado.historico_tv[:10]
                estado.senhas_ativas[req.guiche] = s_removida
                estado.save()
                
                await ws_manager.broadcast({"tipo": "NOVA_SENHA", "data": s_removida.to_dict()})
                await ws_manager.broadcast({"tipo": "FILA_ATUALIZADA"}) # updates history lists
                return s_removida.to_dict()
    raise HTTPException(status_code=404, detail="Senha não encontrada no histórico")

@app.post("/senha/observacao")
async def adicionar_observacao(req: ObservacaoRequest):
    for cat, fila in estado.filas.items():
        for s in fila:
            if s.id == req.senha_id:
                s.observacao = req.observacao
                estado.save()
                return s.to_dict()
    for guiche, s in estado.senhas_ativas.items():
        if s.id == req.senha_id:
            s.observacao = req.observacao
            estado.save()
            return s.to_dict()
    for cat, senhas in estado.senhas_finalizadas.items():
        for s in senhas:
            if s.id == req.senha_id:
                s.observacao = req.observacao
                estado.save()
                return s.to_dict()
    raise HTTPException(status_code=404, detail="Senha não encontrada")

@app.get("/senha/fila/{categoria}")
async def listar_fila_categoria(categoria: str):
    cat = categoria.upper()
    if cat not in estado.filas: raise HTTPException(status_code=400)
    return {"categoria": cat, "total": len(estado.filas[cat]), "senhas": [s.to_dict() for s in estado.filas[cat]]}

@app.get("/senha/status")
async def status_senha():
    ultima = estado.historico_tv[0] if estado.historico_tv else None
    return {"senha_atual": ultima, "historico": estado.historico_tv[1:]}

@app.get("/senha/atendente/{categoria}")
async def estado_atendente(categoria: str, guiche: str = ""):
    cat = categoria.upper()
    if cat not in estado.filas: raise HTTPException(status_code=400)
    senha_ativa = estado.senhas_ativas.get(guiche)
    # Filtrar histórico pelo guichê do atendente
    hist_filtrado = [s for s in estado.senhas_finalizadas.get(cat, []) if s.guiche == guiche] if guiche else estado.senhas_finalizadas.get(cat, [])
    return {
        "senha_ativa": senha_ativa.to_dict() if senha_ativa else None, 
        "fila": {"total": len(estado.filas[cat]), "senhas": [s.to_dict() for s in estado.filas[cat]]},
        "historico": [s.to_dict() for s in hist_filtrado]
    }

@app.get("/atendente/validar/{guiche}")
async def validar_guiche(guiche: str, client_id: str = ""):
    if ws_manager.guiche_esta_online(guiche, client_id):
        return {"ocupado": True, "mensagem": f"O Guichê {guiche} já está sendo utilizado por outro atendente."}
    return {"ocupado": False}

@app.post("/admin/reset")
async def admin_reset():
    """Reseta todos os contadores e filas. Usar no início de cada dia."""
    estado.contadores = {}
    for c in CATEGORIAS:
        estado.contadores[f"{c}N"] = 0
        estado.contadores[f"{c}P"] = 0
    estado.filas = {k: [] for k in CATEGORIAS}
    estado.senhas_ativas = {}
    estado.senhas_finalizadas = {k: [] for k in CATEGORIAS}
    estado.historico_tv = []
    estado.save()
    await ws_manager.broadcast({"tipo": "FILA_ATUALIZADA"})
    return {"status": "ok", "mensagem": "Sistema resetado com sucesso"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)