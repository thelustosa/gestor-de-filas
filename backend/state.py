import os
import json
from typing import List, Dict
from config import STATE_FILE, CATEGORIAS
from models import Senha

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
        try:
            with open(STATE_FILE, "w", encoding="utf-8") as f:
                data = {
                    "contadores": self.contadores,
                    "filas": {k: [s.to_dict() for s in v] for k, v in self.filas.items()},
                    "senhas_ativas": {k: v.to_dict() for k, v in self.senhas_ativas.items()},
                    "senhas_finalizadas": {k: [s.to_dict() for s in v] for k, v in self.senhas_finalizadas.items()},
                    "historico_tv": self.historico_tv
                }
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            print(f"Erro ao salvar estado: {e}")

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
