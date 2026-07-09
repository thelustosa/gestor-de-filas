import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict
from datetime import datetime

NEWS_CACHE = {
    "data": [],
    "last_update": None
}

IMAGENS_PADRAO = [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a6565d?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=600&auto=format&fit=crop&q=80",
]

async def extrair_dados_agr_async() -> List[Dict[str, str]]:
    url = "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
        
        root = ET.fromstring(response.content)
        items = root.findall(".//item")
        
        noticias = []
        for i, item in enumerate(items[:15]):  # Limitar a 15 notícias
            titulo = item.find("title").text if item.find("title") is not None else "Sem título"
            link = item.find("link").text if item.find("link") is not None else "#"
            
            # Escolhe uma imagem da lista de forma cíclica
            imagem = IMAGENS_PADRAO[i % len(IMAGENS_PADRAO)]
            
            noticias.append({
                "titulo": titulo,
                "link": link,
                "imagem": imagem
            })
            
        if not noticias:
            raise ValueError("Nenhuma notícia encontrada no feed RSS")
            
        return noticias
    except Exception as e:
        print(f"Erro ao buscar notícias do Google News: {e}")
        return [
            {
                "titulo": "Aviso: Notícias indisponíveis temporariamente (Erro de Conexão)",
                "link": "#",
                "imagem": "https://via.placeholder.com/400x200?text=Sem+Conexao"
            }
        ]
