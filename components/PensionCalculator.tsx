import React, { useState, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  Settings2,
  ChevronDown,
  User,
  FileDown,
  Info,
  Building,
  ArrowRight
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { CALCULATION_STORAGE_KEYS, loadCalculationSnapshot, saveCalculationSnapshot } from '../lib/calculation-storage';
import { exportPdf } from '../lib/pdf-export';
import { ResultContext } from './ResultContext';

type PensionRegime = '1973' | '1997';

export const PensionCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
}> = ({ notify }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'age' | 'weeks' | 'amount', string>>>({});

  const [regime, setRegime] = useState<PensionRegime>('1973');
  const [age, setAge] = useState<number>(60);
  const [weeks, setWeeks] = useState<number>(500);
  const [averageSalary, setAverageSalary] = useState<number>(0);
  const [aforeBalance, setAforeBalance] = useState<number>(0);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [minWage, setMinWage] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.minWage);
  const [umaValue, setUmaValue] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.uma);

  const [results, setResults] = useState<{
    monthlyPension: number;
    basicAmount: number;
    annualIncrementsAmount: number;
    familyAllowancesAmount: number;
    agePercentage: number;
    regimeUsed: string;
    formulas: {
      basic: string;
      increments: string;
      family: string;
      ageFactor: string;
    };
  } | null>(null);

  React.useEffect(() => {
    const saved = loadCalculationSnapshot<{
      regime: PensionRegime; age: number; weeks: number; averageSalary: number;
      aforeBalance: number; hasSpouse: boolean; childrenCount: number;
    }, NonNullable<typeof results>>(CALCULATION_STORAGE_KEYS.pension);
    if (!saved?.results) return;
    setRegime(saved.inputs.regime ?? '1973');
    setAge(saved.inputs.age ?? 60);
    setWeeks(saved.inputs.weeks ?? 500);
    setAverageSalary(saved.inputs.averageSalary ?? 0);
    setAforeBalance(saved.inputs.aforeBalance ?? 0);
    setHasSpouse(saved.inputs.hasSpouse ?? false);
    setChildrenCount(saved.inputs.childrenCount ?? 0);
    setResults(saved.results);
    setSavedAt(saved.savedAt);
    setActiveTab('results');
  }, []);

  const calculatePension73 = () => {
    let agePercentage = 0;
    if (age === 60) agePercentage = 0.75;
    else if (age === 61) agePercentage = 0.80;
    else if (age === 62) agePercentage = 0.85;
    else if (age === 63) agePercentage = 0.90;
    else if (age === 64) agePercentage = 0.95;
    else if (age >= 65) agePercentage = 1.00;
    else {
      notify("La edad mínima para pensión por cesantía es 60 años", "warning");
      return null;
    }

    if (weeks < 500) {
      notify("Se requieren al menos 500 semanas cotizadas para la Ley del 73", "warning");
      return null;
    }

    if (averageSalary <= 0) {
      notify("Ingrese el salario promedio de los últimos 5 años", "warning");
      return null;
    }

    const salaryUMA = averageSalary / umaValue;
    let basicPercentage = 0;
    let incrementPercentage = 0;

    if (salaryUMA <= 1) {
      basicPercentage = 0.80;
      incrementPercentage = 0.00563;
    } else if (salaryUMA <= 2) {
      basicPercentage = 0.70;
      incrementPercentage = 0.01;
    } else if (salaryUMA <= 3) {
      basicPercentage = 0.60;
      incrementPercentage = 0.015;
    } else if (salaryUMA <= 4) {
      basicPercentage = 0.50;
      incrementPercentage = 0.02;
    } else if (salaryUMA <= 5) {
      basicPercentage = 0.40;
      incrementPercentage = 0.022;
    } else if (salaryUMA <= 6) {
      basicPercentage = 0.35;
      incrementPercentage = 0.023;
    } else {
      basicPercentage = 0.20;
      incrementPercentage = 0.0245;
    }

    const cappedSalary = Math.min(averageSalary, umaValue * 25);
    const basicAmountAnnual = cappedSalary * 365 * basicPercentage;
    const basicAmountMonthly = basicAmountAnnual / 12;

    const extraWeeks = Math.max(0, weeks - 500);
    const incrementYears = Math.floor(extraWeeks / 52);

    const annualIncrementsAmountYearly = cappedSalary * 365 * incrementPercentage * incrementYears;
    const annualIncrementsAmountMonthly = annualIncrementsAmountYearly / 12;

    const subtotal = basicAmountMonthly + annualIncrementsAmountMonthly;

    let familyFactor = 0;
    if (hasSpouse) familyFactor += 0.15;
    familyFactor += (childrenCount * 0.10);
    if (familyFactor === 0) familyFactor = 0.15;

    const familyAllowancesAmount = subtotal * familyFactor;
    const totalBeforeAge = subtotal + familyAllowancesAmount;
    let monthlyPension = totalBeforeAge * agePercentage;
    
    const minPension = minWage * 30;
    if (monthlyPension < minPension) {
      monthlyPension = minPension;
    }

    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    return {
      monthlyPension: round(monthlyPension),
      basicAmount: round(basicAmountMonthly),
      annualIncrementsAmount: round(annualIncrementsAmountMonthly),
      familyAllowancesAmount: round(familyAllowancesAmount),
      agePercentage: agePercentage * 100,
      regimeUsed: '1973',
      formulas: {
        basic: `Salario Promedio: $${cappedSalary.toFixed(2)}\n% Cuantía Básica: ${(basicPercentage*100).toFixed(2)}%\nTotal: $${round(basicAmountMonthly).toFixed(2)}`,
        increments: `Semanas extra: ${extraWeeks}\nAños de incremento: ${incrementYears}\n% Incremento: ${(incrementPercentage*100).toFixed(2)}%\nTotal: $${round(annualIncrementsAmountMonthly).toFixed(2)}`,
        family: `Factor asignaciones: ${(familyFactor*100).toFixed(0)}%\nTotal: $${round(familyAllowancesAmount).toFixed(2)}`,
        ageFactor: `Edad: ${age} años\nPorcentaje aplicado: ${(agePercentage*100).toFixed(0)}%`,
      }
    };
  };

  const calculatePension97 = () => {
    const minWeeksRequired = 875;
    if (age < 60) {
      notify("La edad mínima para pensión por cesantía es 60 años", "warning");
      return null;
    }
    if (weeks < minWeeksRequired) {
      notify(`Para el año 2026 se requieren al menos ${minWeeksRequired} semanas cotizadas`, "warning");
      return null;
    }
    if (aforeBalance <= 0) {
      notify("Ingrese el saldo estimado en su AFORE", "warning");
      return null;
    }

    const estimatedAnnualRate = 0.05;
    const estimatedAnnualPension = aforeBalance * estimatedAnnualRate;
    let monthlyPension = estimatedAnnualPension / 12;
    const guaranteedPension = minWage * 30;

    if (monthlyPension < guaranteedPension) {
       monthlyPension = guaranteedPension;
    }

    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    return {
      monthlyPension: round(monthlyPension),
      basicAmount: round(monthlyPension),
      annualIncrementsAmount: 0,
      familyAllowancesAmount: 0,
      agePercentage: 100,
      regimeUsed: '1997',
      formulas: {
        basic: `Saldo AFORE: $${aforeBalance.toLocaleString()}\nTasa estimada (simplificada): ${(estimatedAnnualRate*100)}%\nPensión Mensual: $${round(monthlyPension).toFixed(2)}`,
        increments: 'No aplica en Régimen 97',
        family: 'No aplica directamente (se descuenta del saldo)',
        ageFactor: `Edad: ${age} años (Cumple requisito)`,
      }
    };
  };

  const calculate = async () => {
    const minWeeks = regime === '1973' ? 500 : 875;
    const errors: typeof fieldErrors = {};
    if (age < 60) errors.age = 'La edad mínima para esta estimación es 60 años.';
    if (weeks < minWeeks) errors.weeks = `Para Ley ${regime} se requieren al menos ${minWeeks} semanas en 2026.`;
    if (regime === '1973' && averageSalary <= 0) errors.amount = 'Ingresa el salario promedio diario de los últimos 5 años.';
    if (regime === '1997' && aforeBalance <= 0) errors.amount = 'Ingresa el saldo estimado que aparece en tu estado de cuenta AFORE.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    let result = null;
    if (regime === '1973') {
      result = calculatePension73();
    } else {
      result = calculatePension97();
    }

    if (result) {
      setResults(result);
      const calculatedAt = new Date().toISOString();
      saveCalculationSnapshot(CALCULATION_STORAGE_KEYS.pension, {
        savedAt: calculatedAt,
        inputs: { regime, age, weeks, averageSalary, aforeBalance, hasSpouse, childrenCount },
        results: result,
      });
      setSavedAt(calculatedAt);
      notify("Cálculo generado exitosamente", "success");
      setActiveTab('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExportPDF = async () => {
    if (!results) return;
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [30, 41, 59];
      const goldColor: [number, number, number] = [212, 175, 55];

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('LEXLABORAL', 20, 25);
      doc.setFontSize(10);
      doc.text('ESTIMACIÓN DE PENSIÓN IMSS', 20, 32);

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
      doc.text(`Régimen: Ley ${results.regimeUsed}`, 20, 50);

      const tableData = [
        ['Edad', `${age} años`],
        ['Semanas Cotizadas', `${weeks}`],
      ];

      if (results.regimeUsed === '1973') {
        tableData.push(['Salario Promedio (5 años)', `$${averageSalary.toFixed(2)}`]);
      } else {
        tableData.push(['Saldo AFORE', `$${aforeBalance.toFixed(2)}`]);
      }

      autoTable(doc, {
        startY: 60,
        head: [['Dato', 'Valor']],
        body: tableData,
        headStyles: { fillColor: primaryColor },
      });

      const bodyData = [];
      if (results.regimeUsed === '1973') {
        bodyData.push(['Cuantía Básica Mensual', `$${results.basicAmount.toFixed(2)}`]);
        bodyData.push(['Incrementos Anuales', `$${results.annualIncrementsAmount.toFixed(2)}`]);
        bodyData.push(['Asignaciones Familiares', `$${results.familyAllowancesAmount.toFixed(2)}`]);
        bodyData.push(['Factor de Edad', `${results.agePercentage}%`]);
      }
      bodyData.push(['PENSIÓN MENSUAL ESTIMADA', `$${results.monthlyPension.toFixed(2)}`]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Concepto', 'Monto (MXN)']],
        body: bodyData,
        headStyles: { fillColor: goldColor, textColor: [0, 0, 0] },
      });

      await exportPdf(doc, `LexLaboral_Pension_${new Date().getTime()}.pdf`, 'Estimación de pensión IMSS');
      notify("PDF generado con éxito", "success");
    } catch (error) {
      notify("Error al generar PDF", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="rounded-b-[2rem] bg-slate-950 px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-md">
        <div className="flex items-center gap-3">
          <img src="/assets/icon-mobile.png" alt="Logo de Lex Laboral" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-legal-gold/40 shadow-lg" />
          <div><h1 className="text-2xl font-serif font-bold text-white">Pensiones IMSS</h1><p className="mt-1 text-sm text-slate-400">Simula tu pensión Ley 73 o 97</p></div>
        </div>
        
        {/* Android Native-like Tabs */}
        <div className="mt-5 flex rounded-full border border-slate-800 bg-slate-900 p-1">
          <button 
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'form' ? 'bg-legal-gold text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Formulario
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'results' ? 'bg-legal-gold text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resultados
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Régimen</label>
                <div className="flex gap-2">
                  {(['1973', '1997'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegime(r)}
                      className={`flex-1 py-4 rounded-xl border transition-all ${
                        regime === r
                          ? 'bg-slate-950 border-slate-950 text-legal-gold font-bold shadow-md'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Ley {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edad (Años)</label>
                  <input type="number" value={age || ''} onChange={(e) => setAge(Number(e.target.value))} aria-invalid={Boolean(fieldErrors.age)} aria-describedby={fieldErrors.age ? 'pension-age-error' : undefined} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none" min="60" />
                  {fieldErrors.age && <p id="pension-age-error" role="alert" className="text-xs font-semibold text-red-700">{fieldErrors.age}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semanas Cot.</label>
                  <input type="number" value={weeks || ''} onChange={(e) => setWeeks(Number(e.target.value))} aria-invalid={Boolean(fieldErrors.weeks)} aria-describedby={fieldErrors.weeks ? 'pension-weeks-error' : undefined} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none" />
                  {fieldErrors.weeks && <p id="pension-weeks-error" role="alert" className="text-xs font-semibold text-red-700">{fieldErrors.weeks}</p>}
                </div>
              </div>

              {regime === '1973' ? (
                <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Salario Promedio Diario (Últimos 5 años)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" value={averageSalary || ''} onChange={(e) => setAverageSalary(Number(e.target.value))} aria-invalid={Boolean(fieldErrors.amount)} aria-describedby={fieldErrors.amount ? 'pension-amount-error' : 'pension-salary-help'} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 text-slate-900 font-bold focus:border-legal-gold focus:ring-1 outline-none transition-all" placeholder="0.00" />
                  </div>
                  <p id="pension-salary-help" className="mt-2 text-[11px] text-slate-500">Consulta el promedio diario en tus semanas cotizadas o comprobantes de salario de los últimos cinco años.</p>
                  {fieldErrors.amount && <p id="pension-amount-error" role="alert" className="mt-2 text-xs font-semibold text-red-700">{fieldErrors.amount}</p>}
                </div>
              ) : (
                <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Saldo Acumulado AFORE</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" value={aforeBalance || ''} onChange={(e) => setAforeBalance(Number(e.target.value))} aria-invalid={Boolean(fieldErrors.amount)} aria-describedby={fieldErrors.amount ? 'pension-amount-error' : 'pension-afore-help'} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 text-slate-900 font-bold focus:border-legal-gold focus:ring-1 outline-none transition-all" placeholder="0.00" />
                  </div>
                  <p id="pension-afore-help" className="mt-2 text-[11px] text-slate-500">Encuéntralo como “saldo total” en tu último estado de cuenta AFORE.</p>
                  {fieldErrors.amount && <p id="pension-amount-error" role="alert" className="mt-2 text-xs font-semibold text-red-700">{fieldErrors.amount}</p>}
                </div>
              )}

              <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full p-5 flex items-center justify-between text-slate-500 hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Settings2 size={16}/> Configuración</span>
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-5 space-y-4">
                      {regime === '1973' && (
                        <>
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <label className="text-xs font-bold text-slate-600">¿Tiene Cónyuge?</label>
                            <input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-legal-gold" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hijos Dependientes</label>
                            <input type="number" value={childrenCount === 0 ? '' : childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold" placeholder="0" />
                          </div>
                        </>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salario Mínimo</label>
                          <input type="number" value={minWage || ''} onChange={(e) => setMinWage(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor UMA</label>
                          <input type="number" value={umaValue || ''} onChange={(e) => setUmaValue(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-0 w-full px-4 z-40 md:relative md:bottom-auto md:px-0 mt-6">
                <button onClick={calculate} className="w-full py-5 bg-gradient-to-r from-slate-950 to-slate-900 text-legal-gold rounded-[2rem] font-bold shadow-2xl shadow-slate-950/40 flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 active:opacity-100 transition-opacity" />
                  <Building size={20} />
                  <span className="uppercase tracking-widest text-sm">Calcular Pensión</span>
                </button>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {!results ? (
                <div className="text-center py-20 bg-white rounded-[1.5rem] border border-slate-100">
                  <Building size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-serif font-bold text-xl text-slate-900">Sin Datos</h3>
                  <p className="text-sm text-slate-500 mt-2">Vuelve al formulario para ingresar datos.</p>
                  <button onClick={() => setActiveTab('form')} className="mt-6 px-6 py-3 bg-slate-950 text-white rounded-full text-xs font-bold uppercase tracking-widest">Ir al Formulario</button>
                </div>
              ) : (
                <>
                  <ResultContext savedAt={savedAt} onEdit={() => setActiveTab('form')} />
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-legal-gold/10 rounded-full blur-3xl" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-legal-gold">Pensión Mensual Aprox.</span>
                    <div className="mt-3 text-5xl font-serif font-bold text-legal-gold flex items-baseline gap-2">
                      ${results.monthlyPension.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      <span className="text-sm font-sans text-slate-400">MXN</span>
                    </div>
                    
                    <div className="mt-8 flex gap-3">
                      <button onClick={handleExportPDF} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
                        <FileDown size={16} /> Descargar PDF
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Desglose de Pensión</h4>
                    <div className="space-y-4">
                      {results.regimeUsed === '1973' && (
                        <>
                          <div className="border-b border-slate-50 pb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-700">Cuantía Básica</span>
                              <span className="text-base font-serif font-bold text-slate-900">${results.basicAmount.toLocaleString()}</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400 font-mono">{results.formulas.basic.replace(/\n/g, ' • ')}</div>
                          </div>
                          <div className="border-b border-slate-50 pb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-700">Incrementos Anuales</span>
                              <span className="text-base font-serif font-bold text-slate-900">${results.annualIncrementsAmount.toLocaleString()}</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400 font-mono">{results.formulas.increments.replace(/\n/g, ' • ')}</div>
                          </div>
                          <div className="border-b border-slate-50 pb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-700">Asignaciones Familiares</span>
                              <span className="text-base font-serif font-bold text-slate-900">${results.familyAllowancesAmount.toLocaleString()}</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400 font-mono">{results.formulas.family.replace(/\n/g, ' • ')}</div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-700">Factor de Edad</span>
                              <span className="text-base font-serif font-bold text-slate-900">{results.agePercentage}%</span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400 font-mono">{results.formulas.ageFactor.replace(/\n/g, ' • ')}</div>
                          </div>
                        </>
                      )}
                      
                      {results.regimeUsed === '1997' && (
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Pensión Estimada</span>
                            <span className="text-base font-serif font-bold text-slate-900">${results.monthlyPension.toLocaleString()}</span>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400 font-mono">{results.formulas.basic.replace(/\n/g, ' • ')}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                    <Info size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-orange-700 leading-relaxed font-bold">
                      Este resultado es una estimación. El cálculo oficial debe ser emitido por el IMSS.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
