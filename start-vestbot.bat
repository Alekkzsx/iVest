@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title VestBot Launcher - Sistema de Estudos [Caminho Fixo]

REM ==============================================
REM  1. Configuração de Diretório
REM ==============================================

:: Definindo o caminho específico que você solicitou
set "PROJECT_DIR=C:\Users\davis.COMPUTADOR\Downloads\VestBot-main"
cd /d "%PROJECT_DIR%"

echo.
echo ========================================
echo    🚀 VestBot - Iniciando...
echo    Diretório: %PROJECT_DIR%
echo ========================================
echo.

REM ==============================================
REM  2. Validação e Pré-requisitos
REM ==============================================

if not exist "package.json" (
    echo ❌ ERRO: O arquivo 'package.json' não foi encontrado em:
    echo "%PROJECT_DIR%"
    pause
    exit /b 1
)

where node >nul 2>&1 [cite: 4]
if errorlevel 1 (
    echo ❌ ERRO: Node.js não instalado ou não está no PATH!
    pause
    exit /b 1
)

REM ==============================================
REM  3. Dependências e Servidores
REM ==============================================

if not exist "node_modules\" (
    echo 📦 Instalando dependências... [cite: 7]
    call npm install --legacy-peer-deps [cite: 7]
)

echo [3/5] Iniciando servidor Backend...
netstat -ano | find "3001" >nul [cite: 9, 10]
if not errorlevel 1 (
    taskkill /F /IM node.exe /T >nul 2>&1 [cite: 10, 17]
    timeout /t 2 /nobreak >nul
)

:: Inicia Backend e Frontend em janelas minimizadas
start "VestBot BACKEND" /MIN cmd /k "npm run server"
echo ⏳ Aguardando Backend...

timeout /t 5 /nobreak >nul

echo [4/5] Iniciando interface Frontend...
start "VestBot FRONTEND" /MIN cmd /k "npm run dev" [cite: 12]

REM ==============================================
REM  4. Finalização
REM ==============================================

echo [5/5] Abrindo navegador em 5 segundos...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ✅ SISTEMA EM EXECUÇÃO
echo Pressione qualquer tecla para FECHAR os servidores e sair.
pause >nul

echo 🛑 Encerrando processos...
taskkill /F /IM node.exe /T >nul 2>&1
exit /b 0