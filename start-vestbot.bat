@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title VestBot Launcher - Sistema de Estudos

REM ==============================================
REM  VestBot Launcher - Otimizado para Windows
REM  Versao: 2.1 (Estável)
REM ==============================================

echo.
echo ========================================
echo    🚀 VestBot - Iniciando...
echo    Sistema de Estudos Vestibular
echo ========================================
echo.

REM Define diretório atual como raiz de forma segura
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

REM ==============================================
REM  0. Validação de Estrutura
REM ==============================================

if not exist "package.json" (
    echo.
    echo ❌ ERRO CRÍTICO: Arquivo 'package.json' nao encontrado!
    echo.
    echo Certifique-se de que este arquivo .bat esta na 
    echo mesma pasta que os arquivos do projeto VestBot.
    echo.
    echo Diretorio atual: "%PROJECT_DIR%"
    echo.
    pause
    exit /b 1
)

REM ==============================================
REM  1. Verificações de Prerequisitos
REM ==============================================

echo [1/5] Verificando prerequisitos...
echo.

REM Verifica Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js nao instalado ou nao esta no PATH!
    echo Baixe e instale: https://nodejs.org/
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version') do set NODE_VER=%%v
echo ✅ Node.js detectado: %NODE_VER%

REM Verifica NPM
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: NPM nao encontrado.
    pause
    exit /b 1
)
echo ✅ NPM detectado

REM Seleciona ferramenta de verificação de rede (Curl ou PowerShell)
set "CHECK_CMD=powershell"
where curl >nul 2>&1
if not errorlevel 1 (
    set "CHECK_CMD=curl"
    echo ✅ Curl detectado (metodo rapido)
) else (
    echo ⚠️  Curl ausente, usando PowerShell (metodo alternativo)
)
echo.

REM ==============================================
REM  2. Instalação de Dependências
REM ==============================================

echo [2/5] Gerenciando dependencias...
echo.

if not exist "node_modules\" (
    echo 📦 Pasta 'node_modules' ausente. Instalando dependencias...
    echo    Isso pode levar alguns minutos. Por favor, aguarde.
    echo.
    call npm install --legacy-peer-deps
    
    if errorlevel 1 (
        echo.
        echo ❌ FALHA na instalação das dependencias via script.
        echo.
        echo Tente rodar manualmente nesta pasta:
        echo   npm install --legacy-peer-deps
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependencias instaladas com sucesso!
) else (
    echo ✅ Dependencias ja verificadas (pasta node_modules existe)
)
echo.

REM ==============================================
REM  3. Iniciar Backend (Porta 3001)
REM ==============================================

echo [3/5] Iniciando servidor Backend...

REM Verifica porta 3001 e limpa processos antigos
netstat -ano | find "3001" >nul
if not errorlevel 1 (
    echo 🧹 A porta 3001 parece estar em uso. Limpando processos Node antigos...
    taskkill /F /IM node.exe /T >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Inicia com cmd /k para manter janela aberta se der erro
REM "start" com titulo definido
start "VestBot BACKEND (Porta 3001)" /MIN cmd /k "color 0A && title VestBot BACKEND && echo Iniciando Servidor... && npm run server"

echo ⏳ Aguardando conexao com Backend (http://localhost:3001)...
set ATTEMPTS=0

:WAIT_BACKEND
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 30 (
    echo.
    echo ⚠️  O Backend demorou demais para responder.
    echo.
    echo 1. Verifique a janela "VestBot BACKEND" minimizada para ver erros.
    echo 2. Se a janela fechou, ha um erro no seu codigo (server.cjs ou package.json).
    echo.
    pause
    goto CLEANUP
)

REM Loop de verificação
if "%CHECK_CMD%"=="curl" (
    curl -s http://localhost:3001/api/health >nul 2>&1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
)

if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto WAIT_BACKEND
)

echo ✅ Backend respondendo com sucesso!
echo.

REM ==============================================
REM  4. Iniciar Frontend (Porta 3000)
REM ==============================================

echo [4/5] Iniciando interface Frontend...

REM Inicia frontend
start "VestBot FRONTEND (Porta 3000)" /MIN cmd /k "color 0B && title VestBot FRONTEND && echo Iniciando Angular/Vite... && npm run dev"

echo ⏳ Aguardando carregamento do Frontend...
set ATTEMPTS=0

:WAIT_FRONTEND
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 45 (
    echo.
    echo ⚠️  O Frontend esta demorando muito.
    echo.
    echo 1. Pode ser apenas o build inicial do Angular/Vite.
    echo 2. Verifique a janela "VestBot FRONTEND".
    echo.
    echo Tentando abrir o navegador mesmo assim...
    goto OPEN_BROWSER
)

if "%CHECK_CMD%"=="curl" (
    curl -s http://localhost:3000 >nul 2>&1
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
)

if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto WAIT_FRONTEND
)

echo ✅ Frontend carregado!
echo.

REM ==============================================
REM  5. Conclusão e Navegador
REM ==============================================

:OPEN_BROWSER
echo [5/5] Abrindo navegador...
timeout /t 2 /nobreak >nul
start http://localhost:3000

cls
echo ==============================================
echo    🎓 VESTBOT ESTA RODANDO
echo ==============================================
echo.
echo    STATUS DO SISTEMA:
echo    ✅ Backend:  Online (Porta 3001)
echo    ✅ Frontend: Online (Porta 3000)
echo    📂 Dados:    %PROJECT_DIR%data\
echo.
echo ==============================================
echo    CONTROLE:
echo    Minimizamos as janelas dos servidores para
echo    nao atrapalhar. Se houver erros, verifique
echo    as janelas "VestBot BACKEND" ou "FRONTEND".
echo ==============================================
echo.
echo    ❌ Para SAIR e FECHAR tudo:
echo    Pressione qualquer tecla nesta janela...
echo.
pause >nul

goto CLEANUP

REM ==============================================
REM  Encerrar Servidores
REM ==============================================

:CLEANUP
echo.
echo 🛑 Encerrando todos os processos do VestBot...
echo.

REM Mata processos node.exe
taskkill /F /IM node.exe /T >nul 2>&1

echo ✅ Sistema encerrado. Ate logo!
timeout /t 3 /nobreak >nul
exit /b 0