@echo off
echo Resetando todas as senhas do sistema AGR...
powershell -Command "Invoke-WebRequest -Uri http://localhost:8001/admin/reset -Method Post"
echo.
echo Sistema resetado com sucesso! As senhas voltarao ao inicio.
pause
