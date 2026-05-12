from datetime import timedelta
import os

CATEGORIAS = {
    'O': 'Ouvidoria',
    'F': 'Finanças',
    'C': 'Cadastro de Veículos e Empresas',
    'P': 'Protocolar Documentos',
}

# Caminho para o diretório backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Pasta para dados persistentes (Banco de dados e Estado)
DATA_DIR = os.path.join(BASE_DIR, "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

STATE_FILE = os.path.join(DATA_DIR, "estado_filas.json")

CACHE_TTL = timedelta(minutes=15)
