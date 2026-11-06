# Calculadora Nutricional Clínica (Adulto y Adulto Mayor)

Aplicación web interactiva diseñada para estudiantes y profesionales de Nutrición y Dietética. Permite realizar el cálculo instantáneo de antropometría, pesos de referencia, gasto energético basal/total (Harris-Benedict y FAO/OMS) y distribución de macronutrientes.

---

## Guía Rápida (Para personas sin conocimientos de programación)

No necesitas saber programar ni escribir comandos para usar esta calculadora en tu computador. Solo sigue estos **3 pasos**:

### Paso 1: Instalar el motor base (Solo se hace una única vez)
La aplicación necesita un programa gratuito llamado **Node.js** para funcionar en tu computador:
1. Entra a **[https://nodejs.org/es](https://nodejs.org/es)**
2. Haz clic en el botón verde que dice **"Descargar Node.js (LTS)"**.
3. Abre el archivo descargado y presiona **"Siguiente" (Next)** a todo hasta finalizar.

### Paso 2: Descargar este proyecto
1. En esta página de GitHub, haz clic en el botón verde **`<> Code`** (arriba a la derecha).
2. Selecciona **"Download ZIP"**.
3. Ve a tu carpeta de *Descargas*, haz clic derecho sobre el archivo `.zip` descargado y elige **"Extraer todo..."** (o descomprimir).

### Paso 3: Abrir la Calculadora con Doble Clic
1. Entra a la carpeta que acabas de descomprimir.
2. Busca el archivo llamado **`iniciar_app.bat`** (en Windows) o **`iniciar_app.sh`** (en Mac/Linux).
3. **Haz doble clic sobre `iniciar_app.bat`**.
   - La primera vez que lo abras, verás que descarga automáticamente las piezas necesarias (tarda unos 20 a 30 segundos).
   - Luego, **se abrirá automáticamente tu navegador web** en la dirección `http://localhost:5173` con la Calculadora Nutricional lista para usar.
   - *Nota:* Mientras estés usando la calculadora, deja abierta la ventana negra que apareció; cuando termines de estudiar o trabajar, simplemente cierra esa ventana negra.

---

## Uso Manual (Para desarrolladores / Terminal)

Si prefieres ejecutar los comandos manualmente desde una terminal (PowerShell, CMD o Bash):

```bash
# 1. Clonar el repositorio
git clone https://github.com/josealfaro7/calc_nutricion.git
cd calc_nutricion

# 2. Instalar dependencias de React, Vite y Tailwind CSS
npm install

# 3. Levantar el servidor local
npm run dev
```

Para ejecutar el script de ingeniería inversa del archivo Excel original (ubicado en `/data`):
```bash
pip install openpyxl
python scripts/analyze_excel.py
```
