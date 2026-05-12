from fastapi import APIRouter
from datetime import datetime
from state import estado
from websocket import ws_manager
from config import CATEGORIAS

from database import get_connection

from utils import formatar_hora, formatar_data, formatar_minutos

router = APIRouter()

@router.post("/admin/reset")
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

@router.get("/admin/export")
async def admin_export():
    """Exporta todas as senhas finalizadas salvas no Banco de Dados para um arquivo CSV."""
    import io
    import csv
    from fastapi.responses import StreamingResponse
    
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    
    # Cabeçalho
    writer.writerow([
        "ID", "Categoria", "Tipo", "Guiche", 
        "Dia Atendimento", "Horario Emissao", "Horario Chamada", "Horario Finalizacao", 
        "Tempo Espera (Min:Seg)", "Tempo Atendimento (Min:Seg)", "Observacao",
        "Espera (segundos)", "Atendimento (segundos)"
    ])
    
    # Coletar todas as senhas do Banco de Dados
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM atendimentos ORDER BY data_referencia DESC, id DESC')
        rows = cursor.fetchall()
        
        for row in rows:
            # Formatação
            dia = formatar_data(row['horario_emissao'])
            h_emissao = formatar_hora(row['horario_emissao'])
            h_chamada = formatar_hora(row['horario_chamada'])
            h_finalizacao = formatar_hora(row['horario_finalizacao'])
            t_espera = formatar_minutos(row['tempo_espera_seg'])
            t_atend = formatar_minutos(row['tempo_atendimento_seg'])
            
            writer.writerow([
                row['senha_id'],
                row['categoria'],
                row['tipo'],
                row['guiche'] or "",
                dia,
                h_emissao,
                h_chamada,
                h_finalizacao,
                t_espera,
                t_atend,
                row['observacao'] or "",
                row['tempo_espera_seg'],
                row['tempo_atendimento_seg']
            ])
        conn.close()
    except Exception as e:
        print(f"Erro ao exportar DB: {e}")
            
    output.seek(0)
    
    filename = f"relatorio_completo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/admin/stats")
async def admin_stats():
    """Retorna estatísticas de guichês ativos e inativos por categoria."""
    stats = {}
    
    # 1. Coletar todos os guichês que estão ONLINE (WebSocket)
    # Lista de dicts: [{"id": "1", "cat": "O"}, ...]
    online_list = []
    for info in ws_manager.active_connections.values():
        if info["guiche"] == "TV": continue
        online_list.append({
            "id": info["guiche"],
            "cat": info.get("categoria", "")
        })

    # 2. Coletar todos os guichês que estão com ATENDIMENTO ATIVO (mesmo que offline)
    # Lista de dicts: [{"id": "1", "cat": "O", "senha": "ON001"}]
    atendimento_list = []
    for chave, s in estado.senhas_ativas.items():
        atendimento_list.append({
            "id": s.guiche,
            "cat": s.categoria,
            "senha": s.id
        })

    # 3. Mapear todos os guichês únicos (par ID + Categoria)
    universo_guiches = set()
    for o in online_list:
        if o["cat"]: universo_guiches.add((o["id"], o["cat"]))
    for a in atendimento_list:
        universo_guiches.add((a["id"], a["cat"]))
    
    # 4. Organizar o retorno por categoria
    for cat_id, cat_nome in CATEGORIAS.items():
        guiches_da_cat = []
        
        # Filtrar o universo para esta categoria
        for g_id, g_cat in universo_guiches:
            if g_cat == cat_id:
                is_online = any(o["id"] == g_id and o["cat"] == g_cat for o in online_list)
                atend = next((a for a in atendimento_list if a["id"] == g_id and a["cat"] == g_cat), None)
                
                guiches_da_cat.append({
                    "id": g_id,
                    "online": is_online,
                    "ocupado": atend is not None,
                    "senha_atual": atend["senha"] if atend else None
                })
        
        # Ordenar por número do guichê (se possível)
        try:
            guiches_da_cat.sort(key=lambda x: int(x["id"]))
        except:
            guiches_da_cat.sort(key=lambda x: x["id"])

        stats[cat_id] = {
            "nome": cat_nome,
            "total": len(guiches_da_cat),
            "ativos": len([g for g in guiches_da_cat if g["online"]]),
            "lista": guiches_da_cat
        }
        
    return stats

@router.post("/admin/reset-guiches")
async def admin_reset_guiches():
    """Limpa todos os atendimentos ativos. Útil para resetar o monitoramento sem zerar os números."""
    estado.senhas_ativas = {}
    estado.save()
    await ws_manager.broadcast({"tipo": "FILA_ATUALIZADA"})
    return {"status": "ok"}
