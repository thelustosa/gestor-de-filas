from fastapi import APIRouter
from datetime import datetime
from news_service import NEWS_CACHE, extrair_dados_agr_async
from config import CACHE_TTL

router = APIRouter()

@router.get("/noticias")
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
