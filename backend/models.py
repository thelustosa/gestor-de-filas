from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from config import CATEGORIAS

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

# Models de Request
class GerarSenhaRequest(BaseModel): 
    categoria: str
    tipo: str = 'N'  # 'N' para Normal, 'P' para Preferencial

class ChamarRequest(BaseModel): 
    categoria: str
    guiche: str

class RechamarRequest(BaseModel): 
    categoria: str
    guiche: str

class FinalizarRequest(BaseModel): 
    categoria: str
    guiche: str

class ObservacaoRequest(BaseModel): 
    senha_id: str
    observacao: str

class HistoricoRechamarRequest(BaseModel): 
    senha_id: str
    categoria: str
    guiche: str
