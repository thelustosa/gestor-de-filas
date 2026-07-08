@echo off
title AGR - Parar Servidores
color 0C

REM Habilita suporte a UTF-8 no terminal
chcp 65001 >nul 2>&1

echo ===================================================
echo     AGR - Parando Servidores (Backend e Frontend)
echo ===================================================
echo.

REM 1. Para o Backend na porta 8001
echo [*] Finalizando processos na porta 8001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM 2. Para o Frontend na porta 5173
echo [*] Finalizando processos na porta 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ===================================================
echo     Servidores finalizados com sucesso!
echo ===================================================
echo.
ping 127.0.0.1 -n 4 >nul
