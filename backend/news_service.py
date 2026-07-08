import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime

NEWS_CACHE = {
    "data": [],
    "last_update": None
}

async def extrair_dados_agr_async() -> List[Dict[str, str]]:
    url = "https://goias.gov.br"
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
            
        if not noticias:
            noticias = [
                {
                    "titulo": "Aviso: Notícias do Governo indisponíveis temporariamente (Vedação Eleitoral)",
                    "link": "#",
                    "imagem": "https://via.placeholder.com/400x200?text=Aviso+Eleitoral"
                },
                {
                    "titulo": "Goiás avança em serviços de atendimento digital",
                    "link": "#",
                    "imagem": "https://via.placeholder.com/400x200?text=Atendimento+GO"
                },
                {
                    "titulo": "Novo sistema de filas melhora o atendimento ao cidadão",
                    "link": "#",
                    "imagem": "https://via.placeholder.com/400x200?text=Sistema+de+Filas"
                }
            ]
            
        return noticias
    except Exception as e:
        print(f"Erro na extração async: {e}")
        return [
            {
                "titulo": "Aviso: Notícias indisponíveis (Erro de Conexão - Vedação Eleitoral)",
                "link": "#",
                "imagem": "https://via.placeholder.com/400x200?text=Sem+Conexao"
            }
        ]
