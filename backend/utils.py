from datetime import datetime

def calcular_segundos(inicio_iso: str, fim_iso: str) -> int:
    try:
        inicio = datetime.fromisoformat(inicio_iso)
        fim = datetime.fromisoformat(fim_iso)
        return max(0, int((fim - inicio).total_seconds()))
    except:
        return 0

def formatar_hora(iso_str: str) -> str:
    if not iso_str: return ""
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%H:%M:%S")
    except:
        return iso_str

def formatar_data(iso_str: str) -> str:
    if not iso_str: return ""
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%d/%m/%Y")
    except:
        return iso_str

def formatar_minutos(segundos: int) -> str:
    if not segundos: return "00:00"
    minutos = segundos // 60
    restante = segundos % 60
    return f"{minutos:02d}:{restante:02d}"
