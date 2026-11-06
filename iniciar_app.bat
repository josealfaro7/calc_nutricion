@echo off
chcp 65001 > nul
title Calculadora Nutricional Clínica - Iniciador Automático
color 0B

echo ======================================================================
echo       CALCULADORA NUTRICIONAL CLÍNICA (ADULTO Y ADULTO MAYOR)
echo ======================================================================
echo.

REM 1. Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] No se detectó Node.js instalado en este computador.
    echo.
    echo Para usar la calculadora por primera vez:
    echo   1. Entra a: https://nodejs.org/
    echo   2. Descarga e instala la versión "LTS" ^(botón verde^).
    echo   3. Vuelve a hacer doble clic en este archivo "iniciar_app.bat".
    echo.
    pause
    exit /b 1
)

echo [1/3] Entorno verificado correctamente.
echo.

REM 2. Instalar dependencias automáticamente si no existe la carpeta node_modules
if not exist "node_modules\" (
    echo [2/3] Primera ejecución detectada: Instalando componentes necesarios...
    echo       ^(Esto tomará entre 15 y 40 segundos, por favor espera^)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo [ERROR] Hubo un problema al instalar las dependencias.
        echo Verifica tu conexión a internet e inténtalo de nuevo.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Componentes ya instalados. Saltando descarga...
)

echo.
echo [3/3] Iniciando la Calculadora Nutricional en tu navegador...
echo       Direccion: http://localhost:5173
echo.
echo ======================================================================
echo   IMPORTANTE: NO CIERRES ESTA VENTANA NEGRA MIENTRAS USES LA APP.
echo   Para apagar la calculadora, simplemente cierra esta ventana.
echo ======================================================================
echo.

REM 3. Abrir el navegador automáticamente y levantar el servidor local
start "" http://localhost:5173
call npm run dev -- --host 127.0.0.1 --port 5173

pause
