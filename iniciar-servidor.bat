@echo off
cd /d "%~dp0"
echo Iniciando servidor local...
start "" "http://localhost:8000/index.html"
where py >nul 2>nul
if %errorlevel%==0 (
    py "%~dp0servidor.py"
) else (
    python "%~dp0servidor.py"
)
pause
