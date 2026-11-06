import React, { useState, useMemo } from 'react';
import {
  User,
  Scale,
  Flame,
  PieChart,
  Activity,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

/**
 * Formatea un número a un máximo de 2 decimales.
 */
export function formatNum(val) {
  if (val === null || val === undefined || Number.isNaN(val) || !Number.isFinite(val)) {
    return '0';
  }
  return Number(Math.round(Number(val + 'e2')) + 'e-2').toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Clasificación clínica referencial del IMC según la hoja 'Datos Adulto' y criterio etario
 */
function getImcClassification(imc, edad) {
  if (!imc || imc <= 0) return { label: 'Sin datos', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  const isAdultoMayor = edad >= 60;

  if (isAdultoMayor) {
    if (imc < 23.0) return { label: 'Bajo Peso (Adulto Mayor < 23.0)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (imc < 28.0) return { label: 'Normal (Adulto Mayor 23.0 - 27.9)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (imc < 32.0) return { label: 'Sobrepeso (Adulto Mayor 28.0 - 31.9)', color: 'bg-orange-50 text-orange-800 border-orange-200' };
    return { label: 'Obesidad (Adulto Mayor ≥ 32.0)', color: 'bg-rose-50 text-rose-800 border-rose-200' };
  }

  if (imc < 16.0) return { label: 'Bajo Peso Severo (< 16.0)', color: 'bg-rose-50 text-rose-800 border-rose-200' };
  if (imc < 17.0) return { label: 'Bajo Peso Moderado (16.0 - 16.99)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (imc < 18.5) return { label: 'Bajo Peso Leve (17.0 - 18.49)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (imc < 25.0) return { label: 'Rango Normal (18.5 - 24.99)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  if (imc < 30.0) return { label: 'Sobrepeso / Pre-Obesidad (25.0 - 29.99)', color: 'bg-orange-50 text-orange-800 border-orange-200' };
  if (imc < 35.0) return { label: 'Obesidad Grado I (30.0 - 34.99)', color: 'bg-rose-50 text-rose-800 border-rose-200' };
  if (imc < 40.0) return { label: 'Obesidad Grado II (35.0 - 39.99)', color: 'bg-rose-100 text-rose-900 border-rose-300' };
  return { label: 'Obesidad Grado III (≥ 40.0)', color: 'bg-rose-100 text-rose-950 border-rose-400' };
}

const PRESET_PATIENTS = [
  {
    id: 'excel-hombre',
    label: 'Caso Excel: Hombre (22a)',
    sexo: 'Hombre',
    edad: 22,
    pesoReal: 85,
    talla: 1.78,
    fa: 1.2,
    fp: 1.0,
    pesoGeb: 58.6,
    formulaActiva: 'harris',
    macros: { prot: 12, lip: 28, cho: 60 },
  },
  {
    id: 'excel-mujer',
    label: 'Caso Excel: Mujer (22a)',
    sexo: 'Mujer',
    edad: 22,
    pesoReal: 65,
    talla: 1.58,
    fa: 1.4,
    fp: 1.0,
    pesoGeb: 54.92,
    formulaActiva: 'fao',
    macros: { prot: 15, lip: 30, cho: 55 },
  },
  {
    id: 'adulto-mayor',
    label: 'Caso Clínico: Adulto Mayor (68a)',
    sexo: 'Hombre',
    edad: 68,
    pesoReal: 78,
    talla: 1.68,
    fa: 1.3,
    fp: 1.1,
    pesoGeb: 71.97,
    formulaActiva: 'harris',
    macros: { prot: 18, lip: 27, cho: 55 },
  },
];

export default function App() {
  // --- SECCIÓN 1: ESTADOS DE DATOS DEL PACIENTE ---
  const [sexo, setSexo] = useState('Hombre');
  const [edad, setEdad] = useState(22);
  const [pesoReal, setPesoReal] = useState(85);
  const [talla, setTalla] = useState(1.78);
  const [fa, setFa] = useState(1.2);
  const [fp, setFp] = useState(1.0);
  const [pesoGeb, setPesoGeb] = useState(68.75);

  // Selector de fórmula base para GET ('harris' | 'fao')
  const [formulaActiva, setFormulaActiva] = useState('harris');

  // --- SECCIÓN 4: ESTADOS DE DISTRIBUCIÓN DE MACRONUTRIENTES ---
  const [pctProt, setPctProt] = useState(15);
  const [pctLip, setPctLip] = useState(30);
  const [pctCho, setPctCho] = useState(55);

  // Modal/Panel de auditoría del Excel
  const [showAuditModal, setShowAuditModal] = useState(false);

  // --- SECCIÓN 2: CÁLCULOS ANTROPOMÉTRICOS Y PESOS ---
  const antropometria = useMemo(() => {
    const t = Number(talla) || 0;
    const pr = Number(pesoReal) || 0;
    const ed = Number(edad) || 0;
    const tallaCuadrado = t > 0 ? t * t : 0;

    // IMC: Peso Real / (Talla^2)
    const imc = tallaCuadrado > 0 ? pr / tallaCuadrado : 0;

    // Peso Mínimo (IMC 18.5): 18.5 * (Talla^2)
    const pesoMinimo = 18.5 * tallaCuadrado;

    // Peso Máximo (IMC 24.9): 24.9 * (Talla^2)
    const pesoMaximo = 24.9 * tallaCuadrado;

    // Peso Ideal según edad y sexo:
    // - Hombre (18-59 años): 21.7 * (Talla^2)
    // - Mujer (18-59 años): 22.0 * (Talla^2)
    // - Adulto Mayor (60+ años, Hombre o Mujer): 25.5 * (Talla^2)
    let factorIdeal = 21.7;
    let categoriaEtaria = 'Adulto (18-59 años)';
    if (ed >= 60) {
      factorIdeal = 25.5;
      categoriaEtaria = 'Adulto Mayor (60+ años)';
    } else if (sexo === 'Mujer') {
      factorIdeal = 22.0;
    }
    const pesoIdeal = factorIdeal * tallaCuadrado;

    // Peso Ajustado: ((Peso Real - Peso Ideal) / 4) + Peso Ideal (Factor estándar del 25%)
    const pesoAjustado = ((pr - pesoIdeal) / 4) + pesoIdeal;

    // Kilos a Bajar/Subir: Peso Real - Peso Ideal
    const diferenciaKilos = pr - pesoIdeal;

    return {
      tallaCuadrado,
      imc,
      pesoMinimo,
      pesoMaximo,
      pesoIdeal,
      factorIdeal,
      categoriaEtaria,
      pesoAjustado,
      diferenciaKilos,
      clasificacionImc: getImcClassification(imc, ed),
    };
  }, [sexo, edad, pesoReal, talla]);

  // --- SECCIÓN 3: CÁLCULOS DE GASTO ENERGÉTICO (GEB Y GET) ---
  const energia = useMemo(() => {
    const pGeb = Number(pesoGeb) || 0;
    const t = Number(talla) || 0;
    const ed = Number(edad) || 0;
    const factorAct = Number(fa) || 0;
    const factorPat = Number(fp) || 0;

    // 1. Harris-Benedict:
    // Hombre: 66.473 + (13.7516 * Peso GEB) + (5.0023 * (Talla * 100)) - (6.755 * Edad)
    // Mujer: 655.1 + (9.6 * Peso GEB) + (1.8 * (Talla * 100)) - (4.7 * Edad)
    const gebHarris =
      sexo === 'Hombre'
        ? 66.473 + (13.7516 * pGeb) + (5.0023 * (t * 100)) - (6.755 * ed)
        : 655.1 + (9.6 * pGeb) + (1.8 * (t * 100)) - (4.7 * ed);

    // 2. FAO/OMS por tramos de edad y sexo:
    // Hombres 18-30: (15.057 * Peso GEB) + 692.2
    // Hombres 30-60: (11.472 * Peso GEB) + 873.1
    // Hombres 61+:   (11.711 * Peso GEB) + 587.7
    // Mujeres 18-30: (14.818 * Peso GEB) + 486.6
    // Mujeres 30-60: (8.126 * Peso GEB) + 845.6
    // Mujeres 61+:   (9.082 * Peso GEB) + 658.5
    const faoTramos = {
      '18-30': sexo === 'Hombre' ? (15.057 * pGeb) + 692.2 : (14.818 * pGeb) + 486.6,
      '30-60': sexo === 'Hombre' ? (11.472 * pGeb) + 873.1 : (8.126 * pGeb) + 845.6,
      '61+': sexo === 'Hombre' ? (11.711 * pGeb) + 587.7 : (9.082 * pGeb) + 658.5,
    };

    let tramoFaoActivo = '18-30';
    let ecuacionFaoTexto = '';
    if (ed <= 30) {
      tramoFaoActivo = '18-30';
      ecuacionFaoTexto = sexo === 'Hombre' ? '(15.057 × Peso GEB) + 692.2' : '(14.818 × Peso GEB) + 486.6';
    } else if (ed <= 60) {
      tramoFaoActivo = '30-60';
      ecuacionFaoTexto = sexo === 'Hombre' ? '(11.472 × Peso GEB) + 873.1' : '(8.126 × Peso GEB) + 845.6';
    } else {
      tramoFaoActivo = '61+';
      ecuacionFaoTexto = sexo === 'Hombre' ? '(11.711 × Peso GEB) + 587.7' : '(9.082 × Peso GEB) + 658.5';
    }

    const gebFao = faoTramos[tramoFaoActivo];

    // GET para ambas fórmulas y para la seleccionada
    const getHarris = gebHarris * factorAct * factorPat;
    const getFao = gebFao * factorAct * factorPat;

    const gebSeleccionado = formulaActiva === 'harris' ? gebHarris : gebFao;
    const getTotal = gebSeleccionado * factorAct * factorPat;

    return {
      gebHarris,
      getHarris,
      gebFao,
      getFao,
      faoTramos,
      tramoFaoActivo,
      ecuacionFaoTexto,
      gebSeleccionado,
      getTotal,
    };
  }, [sexo, edad, talla, pesoGeb, fa, fp, formulaActiva]);

  // --- SECCIÓN 4: CÁLCULOS DE DISTRIBUCIÓN DE MACRONUTRIENTES ---
  const macronutrientes = useMemo(() => {
    const get = energia.getTotal || 0;
    const pr = Number(pesoReal) || 0;
    const pGeb = Number(pesoGeb) || 0;

    const pP = Number(pctProt) || 0;
    const pL = Number(pctLip) || 0;
    const pC = Number(pctCho) || 0;
    const sumaPct = pP + pL + pC;

    // Proteínas (4 kcal/g)
    const kcalProt = (get * pP) / 100;
    const gramosProt = kcalProt / 4;
    const gKgRealProt = pr > 0 ? gramosProt / pr : 0;
    const gKgGebProt = pGeb > 0 ? gramosProt / pGeb : 0;

    // Lípidos (9 kcal/g)
    const kcalLip = (get * pL) / 100;
    const gramosLip = kcalLip / 9;
    const gKgRealLip = pr > 0 ? gramosLip / pr : 0;
    const gKgGebLip = pGeb > 0 ? gramosLip / pGeb : 0;

    // Carbohidratos (4 kcal/g)
    const kcalCho = (get * pC) / 100;
    const gramosCho = kcalCho / 4;
    const gKgRealCho = pr > 0 ? gramosCho / pr : 0;
    const gKgGebCho = pGeb > 0 ? gramosCho / pGeb : 0;

    return {
      sumaPct,
      esValido100: Math.abs(sumaPct - 100) < 0.001,
      proteinas: { pct: pP, kcal: kcalProt, gramos: gramosProt, gKgReal: gKgRealProt, gKgGeb: gKgGebProt, factorKcal: 4 },
      lipidos: { pct: pL, kcal: kcalLip, gramos: gramosLip, gKgReal: gKgRealLip, gKgGeb: gKgGebLip, factorKcal: 9 },
      carbohidratos: { pct: pC, kcal: kcalCho, gramos: gramosCho, gKgReal: gKgRealCho, gKgGeb: gKgGebCho, factorKcal: 4 },
      totalKcal: kcalProt + kcalLip + kcalCho,
      totalGramos: gramosProt + gramosLip + gramosCho,
    };
  }, [energia.getTotal, pesoReal, pesoGeb, pctProt, pctLip, pctCho]);

  // Aplicar un preset de paciente
  const handleSelectPreset = (preset) => {
    setSexo(preset.sexo);
    setEdad(preset.edad);
    setPesoReal(preset.pesoReal);
    setTalla(preset.talla);
    setFa(preset.fa);
    setFp(preset.fp);
    setPesoGeb(preset.pesoGeb);
    setFormulaActiva(preset.formulaActiva);
    setPctProt(preset.macros.prot);
    setPctLip(preset.macros.lip);
    setPctCho(preset.macros.cho);
  };

  // Atajo para asignar Peso Real, Ideal o Ajustado al Peso GEB
  const applyWeightToGeb = (value) => {
    const rounded = Number(Math.round(Number(value + 'e2')) + 'e-2');
    setPesoGeb(rounded);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* HEADER BAR TIPO DASHBOARD CLÍNICO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Calculadora Nutricional Clínica
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  Adulto & Adulto Mayor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Herramienta docente de evaluación antropométrica, gasto energético y adecuación de macronutrientes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              {PRESET_PATIENTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-white hover:text-teal-700 hover:shadow-sm transition-all"
                  title="Cargar caso clínico de ejemplo"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAuditModal(!showAuditModal)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showAuditModal
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ingeniería Inversa Excel</span>
            </button>
          </div>
        </div>
      </header>

      {/* PANEL DESPLEGABLE DE AUDITORÍA DE INGENIERÍA INVERSA DEL EXCEL */}
      {showAuditModal && (
        <div className="bg-slate-900 text-slate-100 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Hallazgos del Análisis con openpyxl (data_only=False)
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Comparativa entre las fórmulas literales extraídas de las hojas <code className="text-teal-300">HOMBRE Adulto &amp; A. Mayor</code> y <code className="text-teal-300">MUJER Adulto &amp; A. Mayor</code> y las correcciones implementadas en la Web App.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                <div className="font-semibold text-amber-300 mb-1">1. Peso Ideal Estático en Hombre (Celda C8)</div>
                <p className="text-slate-300 leading-relaxed">
                  En la hoja <span className="text-white font-medium">HOMBRE</span>, la celda <code className="text-amber-200">C8</code> tenía el valor estático <code className="text-amber-200">21.7</code> (el IMC ideal sin multiplicar por <code className="text-teal-300">D3^2</code>), mientras que en <span className="text-white font-medium">MUJER</span> sí tenía la fórmula <code className="text-teal-300">=22*$D$3^2</code> y en Adulto Mayor <code className="text-teal-300">=25.5*$D$3^2</code>. Corregido a <code className="text-emerald-300">21.7 × Talla²</code>.
                </p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                <div className="font-semibold text-amber-300 mb-1">2. Divisor del Peso Ajustado (Celdas C11-C13)</div>
                <p className="text-slate-300 leading-relaxed">
                  El Excel usaba <code className="text-amber-200">=((C3-C8)/C11)+C8</code> donde <code className="text-amber-200">C11</code> valía <code className="text-amber-200">2</code> en Hombre (50%) y <code className="text-amber-200">3</code> en Mujer (33.3%), bajo una etiqueta confusa <code className="text-amber-200">KG A B*S</code>. Estandarizado al criterio clínico del 25% (<code className="text-emerald-300">((Peso Real - Peso Ideal) / 4) + Peso Ideal</code>) y separado de <code className="text-emerald-300">Kilos a Bajar/Subir</code>.
                </p>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                <div className="font-semibold text-amber-300 mb-1">3. Peso GEB y KCAL R. Desvinculados</div>
                <p className="text-slate-300 leading-relaxed">
                  En el Excel, tanto <code className="text-amber-200">PESO GEB</code> (<code className="text-amber-200">C16/C15</code>) como <code className="text-amber-200">KCAL R.</code> (<code className="text-amber-200">C23/C22</code>) se copiaban a mano. Ahora el estudiante dispone de botones de selección rápida (Real, Ideal, Ajustado) o entrada libre, y vinculación en tiempo real con el GET.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL: GRID DE 4 TARJETAS (CARDS) */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* BARRA DE RESUMEN RÁPIDO DEL PACIENTE */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 block">Estado Nutricional (IMC)</span>
              <span className="text-xl font-bold text-slate-900">{formatNum(antropometria.imc)} <small className="text-xs font-normal text-slate-500">kg/m²</small></span>
            </div>
            <span className={`px-2 py-1 text-[11px] font-semibold rounded-md border ${antropometria.clasificacionImc.color}`}>
              {antropometria.clasificacionImc.label.split(' (')[0]}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 block">Peso Ideal ({antropometria.factorIdeal})</span>
              <span className="text-xl font-bold text-teal-700">{formatNum(antropometria.pesoIdeal)} <small className="text-xs font-normal text-slate-500">kg</small></span>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              {edad >= 60 ? 'A. Mayor' : 'Adulto'}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500 block">GEB ({formulaActiva === 'harris' ? 'Harris-Benedict' : `FAO ${energia.tramoFaoActivo}`})</span>
              <span className="text-xl font-bold text-slate-900">{formatNum(energia.gebSeleccionado)} <small className="text-xs font-normal text-slate-500">kcal</small></span>
            </div>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded-md">
              Base: {formatNum(pesoGeb)} kg
            </span>
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-xl p-3.5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-teal-100 block">Requerimiento Total (GET)</span>
              <span className="text-xl font-bold">{formatNum(energia.getTotal)} <small className="text-xs font-normal text-teal-100">kcal/día</small></span>
            </div>
            <span className="text-xs font-semibold bg-white/15 px-2 py-1 rounded-md backdrop-blur-sm">
              FA {formatNum(fa)} × FP {formatNum(fp)}
            </span>
          </div>
        </div>

        {/* LAS 4 TARJETAS PRINCIPALES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ===================================================================
              TARJETA 1: DATOS DEL PACIENTE (INPUTS)
          =================================================================== */}
          <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 block">Sección 1</span>
                  <h2 className="text-base font-bold text-slate-900">Datos del Paciente</h2>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                {antropometria.categoriaEtaria}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Fila 1: Sexo y Edad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-sexo" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sexo Biológico
                  </label>
                  <select
                    id="input-sexo"
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
                  >
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="input-edad" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Edad <span className="text-slate-400 font-normal">(años)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-edad"
                      type="number"
                      min="18"
                      max="120"
                      step="1"
                      value={edad}
                      onChange={(e) => setEdad(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-12 text-sm font-semibold text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      años
                    </span>
                  </div>
                </div>
              </div>

              {/* Fila 2: Peso Real y Talla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-peso-real" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Peso Real <span className="text-slate-400 font-normal">(kg)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-peso-real"
                      type="number"
                      min="20"
                      max="350"
                      step="0.1"
                      value={pesoReal}
                      onChange={(e) => setPesoReal(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="input-talla" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Talla <span className="text-slate-400 font-normal">(metros, ej: 1.70)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-talla"
                      type="number"
                      min="1.0"
                      max="2.5"
                      step="0.01"
                      value={talla}
                      onChange={(e) => setTalla(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      m
                    </span>
                  </div>
                </div>
              </div>

              {/* Fila 3: Factor de Actividad (FA) y Factor de Estrés/Patología (FP) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-fa" className="block text-xs font-semibold text-slate-700">
                      Factor de Actividad (FA)
                    </label>
                    <span className="text-[11px] text-slate-400">Ej: 1.2 - 1.8</span>
                  </div>
                  <input
                    id="input-fa"
                    type="number"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={fa}
                    onChange={(e) => setFa(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: 'Reposo 1.2', val: 1.2 },
                      { label: 'Ligera 1.4', val: 1.4 },
                      { label: 'Moderada 1.6', val: 1.6 },
                      { label: 'Intensa 1.8', val: 1.8 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setFa(item.val)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                          Number(fa) === item.val
                            ? 'bg-teal-50 border-teal-300 text-teal-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-fp" className="block text-xs font-semibold text-slate-700">
                      Factor Estrés / Patología (FP)
                    </label>
                    <span className="text-[11px] text-slate-400">Ej: 1.0 - 2.0</span>
                  </div>
                  <input
                    id="input-fp"
                    type="number"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={fp}
                    onChange={(e) => setFp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: 'Sano 1.0', val: 1.0 },
                      { label: 'Cirugía 1.1', val: 1.1 },
                      { label: 'Fractura 1.2', val: 1.2 },
                      { label: 'Sepsis 1.3', val: 1.3 },
                      { label: 'Quemadura 1.5', val: 1.5 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setFp(item.val)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                          Number(fp) === item.val
                            ? 'bg-teal-50 border-teal-300 text-teal-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fila 4: Peso GEB a utilizar (con selector asistido para el estudiante) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-peso-geb" className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                      <span>Peso GEB a Utilizar</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-600 text-white rounded">
                        Decisión Clínica
                      </span>
                    </label>
                    <span className="text-[11px] text-teal-700 font-medium">en kg</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2.5">
                    Elige qué peso aplicar en las ecuaciones de gasto energético basal (Real, Ideal, Ajustado o un valor manual):
                  </p>

                  <div className="relative mb-2.5">
                    <input
                      id="input-peso-geb"
                      type="number"
                      min="20"
                      max="350"
                      step="0.01"
                      value={pesoGeb}
                      onChange={(e) => setPesoGeb(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-xl border-2 border-teal-500 bg-white px-3.5 py-2.5 pr-12 text-base font-bold text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-teal-700 font-bold">
                      kg
                    </span>
                  </div>

                  {/* Botones de carga rápida desde Antropometría */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => applyWeightToGeb(pesoReal || 0)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition flex flex-col ${
                        Math.abs(Number(pesoGeb) - Number(pesoReal)) < 0.05
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      <span className="text-[10px] opacity-80">Usar Peso Real</span>
                      <span className="font-bold">{formatNum(pesoReal)} kg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyWeightToGeb(antropometria.pesoIdeal)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition flex flex-col ${
                        Math.abs(Number(pesoGeb) - antropometria.pesoIdeal) < 0.05
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      <span className="text-[10px] opacity-80">Usar Peso Ideal</span>
                      <span className="font-bold">{formatNum(antropometria.pesoIdeal)} kg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyWeightToGeb(antropometria.pesoAjustado)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition flex flex-col ${
                        Math.abs(Number(pesoGeb) - antropometria.pesoAjustado) < 0.05
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      <span className="text-[10px] opacity-80">Usar P. Ajustado</span>
                      <span className="font-bold">{formatNum(antropometria.pesoAjustado)} kg</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              TARJETA 2: ANTROPOMETRÍA Y PESOS (OUTPUTS AUTOMÁTICOS)
          =================================================================== */}
          <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block">Sección 2</span>
                  <h2 className="text-base font-bold text-slate-900">Antropometría y Pesos de Referencia</h2>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Talla² = {formatNum(antropometria.tallaCuadrado)} m²
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Bloque destacado IMC y Kilos a Bajar/Subir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* IMC Card */}
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        IMC (Índice de Masa Corporal)
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {formatNum(antropometria.imc)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">kg/m²</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Peso / Talla²
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Diagnóstico IMC:</span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${antropometria.clasificacionImc.color}`}>
                      {antropometria.clasificacionImc.label}
                    </span>
                  </div>
                </div>

                {/* Kilos a Bajar / Subir Card */}
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Kilos a Bajar / Subir
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span
                          className={`text-3xl font-extrabold ${
                            antropometria.diferenciaKilos > 0.5
                              ? 'text-amber-600'
                              : antropometria.diferenciaKilos < -0.5
                              ? 'text-sky-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {antropometria.diferenciaKilos > 0 ? `+${formatNum(antropometria.diferenciaKilos)}` : formatNum(antropometria.diferenciaKilos)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">kg</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      P. Real - P. Ideal
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Meta ponderal:</span>
                    {Math.abs(antropometria.diferenciaKilos) <= 0.1 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        En su Peso Ideal
                      </span>
                    ) : antropometria.diferenciaKilos > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        Exceso de {formatNum(antropometria.diferenciaKilos)} kg (Bajar)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Déficit de {formatNum(Math.abs(antropometria.diferenciaKilos))} kg (Subir)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de los 4 Pesos Calculados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Peso Mínimo */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-sky-300 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">Peso Mínimo</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">IMC 18.5</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatNum(antropometria.pesoMinimo)} <span className="text-xs font-normal text-slate-500">kg</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                    18.5 × ({formatNum(talla)}²)
                  </div>
                </div>

                {/* Peso Ideal */}
                <div className="rounded-xl border-2 border-teal-500/80 p-3.5 bg-teal-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-teal-900">Peso Ideal</span>
                      <span className="font-mono text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold">
                        IMC {formatNum(antropometria.factorIdeal)}
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-teal-700">
                      {formatNum(antropometria.pesoIdeal)} <span className="text-xs font-normal text-teal-600">kg</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-teal-200/60 text-[11px] text-teal-700 font-mono">
                    {formatNum(antropometria.factorIdeal)} × ({formatNum(talla)}²)
                  </div>
                </div>

                {/* Peso Máximo */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-sky-300 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">Peso Máximo</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">IMC 24.9</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatNum(antropometria.pesoMaximo)} <span className="text-xs font-normal text-slate-500">kg</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                    24.9 × ({formatNum(talla)}²)
                  </div>
                </div>

                {/* Peso Ajustado */}
                <div className="rounded-xl border border-indigo-200 p-3.5 bg-indigo-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-indigo-950">Peso Ajustado</span>
                      <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                        Factor 25%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-700">
                      {formatNum(antropometria.pesoAjustado)} <span className="text-xs font-normal text-indigo-600">kg</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[11px] text-indigo-700 font-mono">
                    ((PR - PI) / 4) + PI
                  </div>
                </div>
              </div>

              {/* Nota pedagógica de criterio de Peso Ideal */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    <strong>Criterio Peso Ideal aplicado:</strong>{' '}
                    {edad >= 60
                      ? 'Adulto Mayor (60+ años, Hombre o Mujer) → IMC ideal 25.5'
                      : sexo === 'Hombre'
                      ? 'Hombre Adulto (18-59 años) → IMC ideal 21.7'
                      : 'Mujer Adulta (18-59 años) → IMC ideal 22.0'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applyWeightToGeb(antropometria.pesoIdeal)}
                  className="text-teal-700 hover:text-teal-800 font-semibold underline shrink-0 ml-2"
                >
                  Enviar Peso Ideal a GEB
                </button>
              </div>
            </div>
          </section>

          {/* ===================================================================
              TARJETA 3: GASTO ENERGÉTICO (GEB Y GET)
          =================================================================== */}
          <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">Sección 3</span>
                  <h2 className="text-base font-bold text-slate-900">Gasto Energético (GEB y GET)</h2>
                </div>
              </div>

              {/* Selector de fórmula activa para el GET */}
              <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormulaActiva('harris')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formulaActiva === 'harris'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Usar Harris-Benedict
                </button>
                <button
                  type="button"
                  onClick={() => setFormulaActiva('fao')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formulaActiva === 'fao'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Usar FAO/OMS
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Comparativa de Ecuaciones GEB (Harris-Benedict vs FAO/OMS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Card Harris-Benedict */}
                <div
                  onClick={() => setFormulaActiva('harris')}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    formulaActiva === 'harris'
                      ? 'border-teal-600 bg-teal-50/30 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      1. Harris-Benedict
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formulaActiva === 'harris'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {formulaActiva === 'harris' ? 'SELECCIONADA' : 'Click para elegir'}
                    </span>
                  </div>

                  <div className="my-2">
                    <span className="text-xs text-slate-500 block">Gasto Energético Basal (GEB):</span>
                    <div className="text-2xl font-extrabold text-slate-900">
                      {formatNum(energia.gebHarris)} <span className="text-xs font-semibold text-slate-500">kcal/día</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-white/80 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] leading-relaxed">
                    {sexo === 'Hombre'
                      ? `66.473 + (13.7516 × ${formatNum(pesoGeb)}) + (5.0023 × ${formatNum((Number(talla) || 0) * 100)}) - (6.755 × ${formatNum(edad)})`
                      : `655.1 + (9.6 × ${formatNum(pesoGeb)}) + (1.8 × ${formatNum((Number(talla) || 0) * 100)}) - (4.7 × ${formatNum(edad)})`}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">GET con Harris:</span>
                    <span className="font-bold text-slate-800">{formatNum(energia.getHarris)} kcal</span>
                  </div>
                </div>

                {/* 2. Card FAO/OMS */}
                <div
                  onClick={() => setFormulaActiva('fao')}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    formulaActiva === 'fao'
                      ? 'border-teal-600 bg-teal-50/30 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      2. FAO/OMS ({energia.tramoFaoActivo} años)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formulaActiva === 'fao'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {formulaActiva === 'fao' ? 'SELECCIONADA' : 'Click para elegir'}
                    </span>
                  </div>

                  <div className="my-2">
                    <span className="text-xs text-slate-500 block">Gasto Energético Basal (GEB):</span>
                    <div className="text-2xl font-extrabold text-slate-900">
                      {formatNum(energia.gebFao)} <span className="text-xs font-semibold text-slate-500">kcal/día</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-white/80 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] leading-relaxed">
                    {energia.ecuacionFaoTexto}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">GET con FAO/OMS:</span>
                    <span className="font-bold text-slate-800">{formatNum(energia.getFao)} kcal</span>
                  </div>
                </div>
              </div>

              {/* Desglose completo de los 3 tramos etarios FAO/OMS (como en las filas 18-21 del Excel) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Referencia de Tramos FAO/OMS ({sexo}, Peso GEB = {formatNum(pesoGeb)} kg)</span>
                  <span className="text-[11px] text-slate-400">Tramo activo según edad ({edad} años)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { key: '18-30', label: '18 - 30 años', geb: energia.faoTramos['18-30'] },
                    { key: '30-60', label: '30 - 60 años', geb: energia.faoTramos['30-60'] },
                    { key: '61+', label: '61 y + años', geb: energia.faoTramos['61+'] },
                  ].map((t) => {
                    const isCurrent = energia.tramoFaoActivo === t.key;
                    return (
                      <div
                        key={t.key}
                        className={`rounded-lg p-2 border ${
                          isCurrent
                            ? 'bg-white border-teal-500 ring-1 ring-teal-500/30'
                            : 'bg-slate-100/70 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">{t.label}</span>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-teal-500" title="Tramo etario del paciente" />
                          )}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">{formatNum(t.geb)} kcal</div>
                        <div className="text-[10px] text-slate-500">
                          GET: {formatNum(t.geb * (Number(fa) || 0) * (Number(fp) || 0))} kcal
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Resultado Principal: Requerimiento Energético Total (GET) */}
              <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
                    3. Requerimiento Energético Total (GET)
                  </span>
                  <div className="text-xs text-slate-300 mt-0.5 font-mono">
                    {formatNum(energia.gebSeleccionado)} kcal ({formulaActiva === 'harris' ? 'Harris-Benedict' : `FAO/OMS ${energia.tramoFaoActivo}`}) × FA ({formatNum(fa)}) × FP ({formatNum(fp)})
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-teal-300 tracking-tight">
                    {formatNum(energia.getTotal)}
                  </span>
                  <span className="text-xs font-semibold text-slate-300 ml-1.5">kcal/día</span>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================
              TARJETA 4: DISTRIBUCIÓN DE MACRONUTRIENTES
          =================================================================== */}
          <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">Sección 4</span>
                  <h2 className="text-base font-bold text-slate-900">Distribución de Macronutrientes</h2>
                </div>
              </div>

              {/* Indicador de validación del 100% */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  macronutrientes.esValido100
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {macronutrientes.esValido100 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Suma: {formatNum(macronutrientes.sumaPct)}% (Correcto)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Suma: {formatNum(macronutrientes.sumaPct)}% (Debe sumar 100%)</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Presets rápidos de distribución de macros */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 font-medium">Distribución sobre GET ({formatNum(energia.getTotal)} kcal):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Estándar (15 / 30 / 55)', p: 15, l: 30, c: 55 },
                    { label: 'Excel Hombre (12 / 28 / 60)', p: 12, l: 28, c: 60 },
                    { label: 'Hiperproteica (20 / 25 / 55)', p: 20, l: 25, c: 55 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPctProt(preset.p);
                        setPctLip(preset.l);
                        setPctCho(preset.c);
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barra de proporción visual */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  style={{ width: `${Math.max(0, Math.min(100, macronutrientes.proteinas.pct))}%` }}
                  className="bg-rose-500 transition-all duration-200"
                  title={`Proteínas: ${formatNum(macronutrientes.proteinas.pct)}%`}
                />
                <div
                  style={{ width: `${Math.max(0, Math.min(100, macronutrientes.lipidos.pct))}%` }}
                  className="bg-amber-400 transition-all duration-200"
                  title={`Lípidos: ${formatNum(macronutrientes.lipidos.pct)}%`}
                />
                <div
                  style={{ width: `${Math.max(0, Math.min(100, macronutrientes.carbohidratos.pct))}%` }}
                  className="bg-sky-500 transition-all duration-200"
                  title={`Carbohidratos: ${formatNum(macronutrientes.carbohidratos.pct)}%`}
                />
              </div>

              {/* Alerta si la suma no es 100% */}
              {!macronutrientes.esValido100 && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center justify-between text-xs text-rose-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      La suma actual de porcentajes es <strong>{formatNum(macronutrientes.sumaPct)}%</strong>. Ajusta los valores para que sumen exactamente <strong>100%</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const rest = 100 - (Number(pctProt) || 0) - (Number(pctLip) || 0);
                      setPctCho(Math.max(0, Number(Math.round(Number(rest + 'e2')) + 'e-2')));
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 shrink-0 ml-2"
                  >
                    Ajustar CHO a {formatNum(Math.max(0, 100 - (Number(pctProt) || 0) - (Number(pctLip) || 0)))}%
                  </button>
                </div>
              )}

              {/* Tabla de Macronutrientes */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3.5">Macronutriente</th>
                      <th className="py-3 px-3 text-center w-28">Porcentaje (%)</th>
                      <th className="py-3 px-3 text-right">Energía (Kcal)</th>
                      <th className="py-3 px-3 text-right">Gramos (g)</th>
                      <th className="py-3 px-3.5 text-right">g / kg Peso Real</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {/* Fila Proteínas */}
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Proteínas</div>
                            <div className="text-[11px] text-slate-400">4 kcal / g</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="relative">
                          <input
                            aria-label="Porcentaje Proteínas"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={pctProt}
                            onChange={(e) => setPctProt(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 pr-6 text-center font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        {formatNum(macronutrientes.proteinas.kcal)} <span className="text-xs font-normal text-slate-400">kcal</span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-rose-700">
                        {formatNum(macronutrientes.proteinas.gramos)} <span className="text-xs font-normal text-rose-500">g</span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="inline-block font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {formatNum(macronutrientes.proteinas.gKgReal)} <small className="text-[11px] font-normal text-slate-500">g/kg</small>
                        </span>
                      </td>
                    </tr>

                    {/* Fila Lípidos */}
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Lípidos</div>
                            <div className="text-[11px] text-slate-400">9 kcal / g</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="relative">
                          <input
                            aria-label="Porcentaje Lípidos"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={pctLip}
                            onChange={(e) => setPctLip(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 pr-6 text-center font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        {formatNum(macronutrientes.lipidos.kcal)} <span className="text-xs font-normal text-slate-400">kcal</span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-amber-700">
                        {formatNum(macronutrientes.lipidos.gramos)} <span className="text-xs font-normal text-amber-600">g</span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="inline-block font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {formatNum(macronutrientes.lipidos.gKgReal)} <small className="text-[11px] font-normal text-slate-500">g/kg</small>
                        </span>
                      </td>
                    </tr>

                    {/* Fila Carbohidratos */}
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900">Carbohidratos (CHO)</div>
                            <div className="text-[11px] text-slate-400">4 kcal / g</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="relative">
                          <input
                            aria-label="Porcentaje Carbohidratos"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={pctCho}
                            onChange={(e) => setPctCho(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 pr-6 text-center font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        {formatNum(macronutrientes.carbohidratos.kcal)} <span className="text-xs font-normal text-slate-400">kcal</span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-sky-700">
                        {formatNum(macronutrientes.carbohidratos.gramos)} <span className="text-xs font-normal text-sky-500">g</span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="inline-block font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {formatNum(macronutrientes.carbohidratos.gKgReal)} <small className="text-[11px] font-normal text-slate-500">g/kg</small>
                        </span>
                      </td>
                    </tr>
                  </tbody>

                  {/* Fila Total */}
                  <tfoot>
                    <tr className="bg-slate-100/80 border-t border-slate-200 font-bold text-slate-900 text-xs">
                      <td className="py-3 px-3.5 uppercase">Total Distribuido</td>
                      <td className="py-3 px-3 text-center">
                        <span className={macronutrientes.esValido100 ? 'text-emerald-700' : 'text-rose-600'}>
                          {formatNum(macronutrientes.sumaPct)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">{formatNum(macronutrientes.totalKcal)} kcal</td>
                      <td className="py-3 px-3 text-right">{formatNum(macronutrientes.totalGramos)} g</td>
                      <td className="py-3 px-3.5 text-right text-slate-500 font-normal">
                        Base: {formatNum(pesoReal)} kg
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Resumen de Fórmulas Aplicadas */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Fórmulas:</strong> Kcal = (GET × %) / 100 &nbsp;|&nbsp; Gramos = Kcal / (4 ó 9) &nbsp;|&nbsp; g/kg = Gramos / Peso Real ({formatNum(pesoReal)} kg)
                </span>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
