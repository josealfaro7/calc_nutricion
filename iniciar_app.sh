#!/usr/bin/env bash

echo "======================================================================"
echo "      CALCULADORA NUTRICIONAL CLÍNICA (ADULTO Y ADULTO MAYOR)"
echo "======================================================================"
echo ""

# 1. Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERROR] No se detectó Node.js instalado en este computador."
    echo "Descárgalo e instálalo desde: https://nodejs.org/ (Versión LTS)"
    exit 1
fi

echo "[1/3] Entorno verificado correctamente."

# 2. Instalar dependencias si no existe node_modules
if [ ! -d "node_modules" ]; then
    echo "[2/3] Primera ejecución: Instalando dependencias (espera unos segundos)..."
    npm install
else
    echo "[2/3] Dependencias ya instaladas."
fi

echo "[3/3] Abriendo la Calculadora Nutricional en http://localhost:5173 ..."
echo "      (Presiona Ctrl + C en esta ventana cuando quieras apagarla)"
echo ""

# 3. Abrir navegador según el sistema operativo y levantar el servidor
if command -v open &> /dev/null; then
    (sleep 2 && open "http://localhost:5173") &
elif command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open "http://localhost:5173") &
fi

npm run dev -- --host 127.0.0.1 --port 5173
