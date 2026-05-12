import sqlite3
import os
from datetime import datetime
from config import DATA_DIR

DB_PATH = os.path.join(DATA_DIR, "atendimentos.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa o banco de dados e cria a tabela se não existir."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS atendimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            senha_id TEXT NOT NULL,
            categoria TEXT NOT NULL,
            tipo TEXT NOT NULL,
            guiche TEXT,
            horario_emissao TEXT,
            horario_chamada TEXT,
            horario_finalizacao TEXT,
            tempo_espera_seg INTEGER,
            tempo_atendimento_seg INTEGER,
            observacao TEXT,
            data_referencia TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def salvar_atendimento(senha_data: dict):
    """Salva uma senha finalizada no banco de dados."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # data_referencia é usada para agrupar atendimentos do mesmo dia
    data_referencia = datetime.now().strftime("%Y-%m-%d")
    
    cursor.execute('''
        INSERT INTO atendimentos (
            senha_id, categoria, tipo, guiche, 
            horario_emissao, horario_chamada, horario_finalizacao,
            tempo_espera_seg, tempo_atendimento_seg, observacao,
            data_referencia
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        senha_data.get('id'),
        senha_data.get('categoria_nome'),
        senha_data.get('tipo'),
        senha_data.get('guiche'),
        senha_data.get('horario_emissao'),
        senha_data.get('horario_chamada'),
        senha_data.get('horario_finalizacao'),
        senha_data.get('tempo_espera_seg'),
        senha_data.get('tempo_atendimento_seg'),
        senha_data.get('observacao'),
        data_referencia
    ))
    conn.commit()
    conn.close()

def buscar_historico_db(limit=500):
    """Busca os últimos atendimentos salvos no banco."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM atendimentos ORDER BY id DESC LIMIT ?', (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

# Inicializa o banco ao importar o módulo
init_db()
