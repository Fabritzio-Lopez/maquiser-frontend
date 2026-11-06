@echo off
title Servidor Frontend - Maquiser SRL (React + Vite + Three.js)
color 0B
echo ==============================================================
echo        INICIANDO FRONTEND MAQUISER SRL (REACT + VITE)
echo ==============================================================
echo.
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Node.js instalado en el sistema.
    echo Por favor descarga e instala Node.js LTS desde: https://nodejs.org/
    echo Luego de instalarlo, vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b
)

if not exist "node_modules" (
    echo [INFO] Primera ejecucion detectada. Instalando paquetes (React, Three.js, Tailwind)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b
    )
)

echo.
echo [OK] Dependencias listas. Arrancando servidor de desarrollo...
echo.
call npm run dev
pause
