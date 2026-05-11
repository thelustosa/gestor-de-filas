@echo off
echo Encerrando processos do sistema AGR...
taskkill /IM node.exe /F 2>nul
taskkill /IM python.exe /F 2>nul
echo Processos encerrados!
pause
