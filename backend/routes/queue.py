from fastapi import APIRouter, HTTPException
from datetime import datetime
from models import (
    GerarSenhaRequest, ChamarRequest, RechamarRequest, 
    FinalizarRequest, ObservacaoRequest, HistoricoRechamarRequest, Senha
)
from state import estado
from websocket import ws_manager
from config import CATEGORIAS
from utils import calcular_segundos
from database import salvar_atendimento

router = APIRouter()

@router.post("/senha/gerar")
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

@router.post("/senha/chamar")
async def chamar_senha(req: ChamarRequest):
    cat = req.categoria.upper()
    if cat not in estado.filas: raise HTTPException(status_code=400)
    fila = estado.filas[cat]
    if not fila: return {"erro": f"Nenhuma senha aguardando em {CATEGORIAS.get(cat, cat)}"}

    chave_guiche = f"{req.categoria}_{req.guiche}"
    if chave_guiche in estado.senhas_ativas:
        anterior = estado.senhas_ativas[chave_guiche]
        if anterior.status == "chamada":
            agora = datetime.now().isoformat()
            anterior.status = "finalizada"
            anterior.horario_finalizacao = agora
            if anterior.horario_chamada:
                anterior.tempo_atendimento_seg = calcular_segundos(anterior.horario_chamada, agora)
            # Salvar no histórico de finalizadas
            estado.senhas_finalizadas[anterior.categoria].insert(0, anterior)
            
            # Salvar permanentemente no Banco de Dados
            salvar_atendimento(anterior.to_dict())
            
            del estado.senhas_ativas[chave_guiche]

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
        proxima.tempo_espera_seg = calcular_segundos(proxima.horario_emissao, agora)

    chave_guiche = f"{req.categoria}_{req.guiche}"
    estado.senhas_ativas[chave_guiche] = proxima
    estado.historico_tv.insert(0, {"senha": proxima.id, "guiche": req.guiche})
    estado.historico_tv = estado.historico_tv[:10]
    estado.save()
    
    # Broadcast the new password call
    await ws_manager.broadcast({"tipo": "NOVA_SENHA", "data": proxima.to_dict()})
    return proxima.to_dict()

@router.post("/senha/rechamar")
async def rechamar_senha(req: RechamarRequest):
    chave_guiche = f"{req.categoria}_{req.guiche}"
    if chave_guiche not in estado.senhas_ativas: return {"erro": "Nenhuma senha ativa neste guichê"}
    senha = estado.senhas_ativas[chave_guiche]
    
    # Broadcast rechamada
    await ws_manager.broadcast({"tipo": "NOVA_SENHA", "data": senha.to_dict()})
    return senha.to_dict()

@router.post("/senha/finalizar")
async def finalizar_senha(req: FinalizarRequest):
    chave_guiche = f"{req.categoria}_{req.guiche}"
    if chave_guiche not in estado.senhas_ativas: return {"erro": "Nenhuma senha ativa"}
    senha = estado.senhas_ativas[chave_guiche]
    if senha.status != "chamada": return {"erro": "Senha não está em atendimento"}
    
    agora = datetime.now().isoformat()
    senha.status = "finalizada"
    senha.horario_finalizacao = agora
    if senha.horario_chamada:
        senha.tempo_atendimento_seg = calcular_segundos(senha.horario_chamada, agora)
        
    estado.senhas_finalizadas[senha.categoria].insert(0, senha)
    
    # Salvar permanentemente no Banco de Dados
    salvar_atendimento(senha.to_dict())
    
    del estado.senhas_ativas[chave_guiche]
    estado.save()
    await ws_manager.broadcast({"tipo": "FILA_ATUALIZADA"})
    return senha.to_dict()

@router.post("/senha/historico/rechamar")
async def historico_rechamar_senha(req: HistoricoRechamarRequest):
    chave_guiche = f"{req.categoria}_{req.guiche}"
    # Se ja houver alguem em atendimento, finaliza primeiro
    if chave_guiche in estado.senhas_ativas:
        anterior = estado.senhas_ativas[chave_guiche]
        if anterior.status == "chamada":
            agora = datetime.now().isoformat()
            anterior.status = "finalizada"
            anterior.horario_finalizacao = agora
            if anterior.horario_chamada:
                anterior.tempo_atendimento_seg = calcular_segundos(anterior.horario_chamada, agora)
            estado.senhas_finalizadas[anterior.categoria].insert(0, anterior)
            
            # Salvar permanentencialmente no Banco de Dados
            salvar_atendimento(anterior.to_dict())
            
            del estado.senhas_ativas[chave_guiche]

    # Agora procura no historico e resgata
    for cat, senhas in estado.senhas_finalizadas.items():
        for i, s in enumerate(senhas):
            if s.id == req.senha_id:
                s_removida = senhas.pop(i)
                s_removida.status = "chamada"
                s_removida.guiche = req.guiche # Atualiza o guiche pro atendente que rechamou
                
                estado.historico_tv.insert(0, {"senha": s_removida.id, "guiche": req.guiche})
                estado.historico_tv = estado.historico_tv[:10]
                estado.senhas_ativas[chave_guiche] = s_removida
                estado.save()
                
                await ws_manager.broadcast({"tipo": "NOVA_SENHA", "data": s_removida.to_dict()})
                await ws_manager.broadcast({"tipo": "FILA_ATUALIZADA"}) # updates history lists
                return s_removida.to_dict()
    raise HTTPException(status_code=404, detail="Senha não encontrada no histórico")

@router.post("/senha/observacao")
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

@router.get("/senha/fila/{categoria}")
async def listar_fila_categoria(categoria: str):
    cat = categoria.upper()
    if cat not in estado.filas: raise HTTPException(status_code=400)
    return {"categoria": cat, "total": len(estado.filas[cat]), "senhas": [s.to_dict() for s in estado.filas[cat]]}

@router.get("/senha/status")
async def status_senha():
    ultima = estado.historico_tv[0] if estado.historico_tv else None
    return {"senha_atual": ultima, "historico": estado.historico_tv[1:]}

@router.get("/senha/atendente/{categoria}")
async def estado_atendente(categoria: str, guiche: str = ""):
    cat = categoria.upper()
    if cat not in estado.filas: raise HTTPException(status_code=400)
    chave_guiche = f"{cat}_{guiche}"
    senha_ativa = estado.senhas_ativas.get(chave_guiche)
    # Filtrar histórico pelo guichê do atendente
    hist_filtrado = [s for s in estado.senhas_finalizadas.get(cat, []) if s.guiche == guiche] if guiche else estado.senhas_finalizadas.get(cat, [])
    return {
        "senha_ativa": senha_ativa.to_dict() if senha_ativa else None, 
        "fila": {"total": len(estado.filas[cat]), "senhas": [s.to_dict() for s in estado.filas[cat]]},
        "historico": [s.to_dict() for s in hist_filtrado]
    }

@router.get("/atendente/validar/{guiche}")
async def validar_guiche(guiche: str, client_id: str = ""):
    if ws_manager.guiche_esta_online(guiche, client_id):
        return {"ocupado": True, "mensagem": f"O Guichê {guiche} já está sendo utilizado por outro atendente."}
    return {"ocupado": False}
