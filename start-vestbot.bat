@echo off
chcp 65001 >nul
title VestBot Launcher

echo.
echo ========================================
echo    🚀 Iniciando VestBot...
echo ========================================
echo.

REM Salva o diretório atual
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

REM Verifica se node_modules existe
if not exist "node_modules\" (
    echo 📦 Instalando dependências...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
)

REM Inicia o backend em background
echo 🔧 Iniciando backend server...
echo.
start /B npm run server
timeout /t 2 /nobreak >nul

REM Inicia o frontend em background
echo 🔧 Iniciando frontend...
echo.
start /B npm run dev
timeout /t 3 /nobreak >nul

REM Aguarda o backend estar pronto (porta 3001)
echo ⏳ Aguardando backend iniciar (porta 3001)...
set ATTEMPTS=0
:WAIT_BACKEND
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 30 (
    echo.
    echo ⚠️  Backend não iniciou a tempo, mas continuando...
    goto CHECK_FRONTEND
)

REM Verifica se a porta 3001 está respondendo
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto WAIT_BACKEND
)

echo ✅ Backend pronto!
echo.

:CHECK_FRONTEND
REM Aguarda o frontend estar pronto (porta 3000)
echo ⏳ Aguardando frontend iniciar (porta 3000)...
set ATTEMPTS=0
:WAIT_FRONTEND
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 30 (
    echo.
    echo ❌ Timeout: Frontend não iniciou a tempo
    echo.
    echo Encerrando processos...
    taskkill /F /IM node.exe /T >nul 2>&1
    pause
    exit /b 1
)

REM Verifica se a porta 3000 está respondendo
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto WAIT_FRONTEND
)

echo ✅ Frontend pronto!
echo.

REM Abre o navegador
echo 🌐 Abrindo navegador...
start http://localhost:3000

echo.
echo ========================================
echo    ✨ VestBot está rodando!
echo    📍 Frontend: http://localhost:3000
echo    📍 Backend:  http://localhost:3001
echo ========================================
echo.
echo Pressione qualquer tecla para encerrar os servidores...
pause >nul

REM Encerra todos os processos Node.js
echo.
echo 🛑 Encerrando VestBot...
taskkill /F /IM node.exe /T >nul 2>&1

echo ✅ Encerrado com sucesso!
timeout /t 2 /nobreak >nul
