@echo off
title AGR - Inicializador do Sistema

REM Desativa cores ANSI caso o terminal legado nao as suporte, evitando textos quebrados (como [32m)
set NO_COLOR=1
set NODE_DISABLE_COLORS=1

color 0A
echo ===================================================
echo     AGR - Sistema de Atendimento Inteligente
echo ===================================================
echo.

REM 1. Verifica/Instala dependências do Python
echo [*] Verificando dependencias do Backend (Python)...
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] Python nao foi encontrado no sistema!
    echo Por favor, instale o Python 3.10 ou superior e certifique-se de marcar a opcao "Add Python to PATH" durante a instalacao.
    echo.
    pause
    
    exit /b 1
)

python -c "import fastapi, uvicorn, bs4, httpx" >nul 2>&1
if errorlevel 1 (
    echo [*] Dependencias do Python nao encontradas. Instalando...
    python -m pip install --upgrade pip
    pip install fastapi uvicorn beautifulsoup4 httpx
    if errorlevel 1 (
        color 0C
        echo [ERRO] Falha ao instalar dependencias do Python.
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencias do Python instaladas com sucesso.
) else (
    echo [OK] Dependencias do Python ja estao instaladas.
)

echo.

REM 2. Verifica/Instala dependências do Node.js
echo [*] Verificando dependencias do Frontend (Node.js)...
call npm -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERRO] Node.js/NPM nao foi encontrado no sistema!
    echo Por favor, baixe e instale o Node.js do site oficial - https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo [*] Pasta node_modules nao encontrada. Instalando dependencias do React...
    cd frontend
    call npm install
    cd ..
    if errorlevel 1 (
        color 0C
        echo [ERRO] Falha ao instalar dependencias do Node.js.
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencias do Frontend instaladas com sucesso.
) else (
    echo [OK] Dependencias do Frontend ja estao instaladas.
)

echo.
echo ===================================================
echo     Iniciando os servidores do Backend e Frontend...
echo ===================================================
echo.

REM Inicia o backend em uma nova janela visível.
REM O parametro /k mantem a janela aberta se o processo encerrar (bom para ver erros).
echo [*] Iniciando o Backend Python em uma nova janela...
start "AGR - Backend (Python)" cmd /k "cd backend && python main.py"

REM Inicia o frontend na janela de terminal atual.
echo [*] Iniciando o Frontend React na janela atual...
echo.
cd frontend
call npm run dev
