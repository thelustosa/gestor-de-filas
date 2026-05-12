import uvicorn
import sys
import os

# Adiciona o diretório atual ao sys.path para permitir imports relativos se necessário
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
