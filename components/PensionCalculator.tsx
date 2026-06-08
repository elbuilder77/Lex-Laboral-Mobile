import React, { useState, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  Settings2,
  ChevronDown,
  TrendingUp,
  User,
  FileDown,
  Info,
  Building
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { SEOContentSection } from './SEOContentSection';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';

type PensionRegime = '1973' | '1997';

const LazyBreakdownChart = React.lazy(() =>
  import('./BreakdownChart').then((module) => ({ default: module.BreakdownChart }))
);

export const PensionCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
  onRequireLogin?: () => void;
}> = ({ notify, onRequireLogin }) => {
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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

  const calculatePension73 = () => {
    // Basic rules for Law 73 (Approximations for estimation)
    // Age percentage
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

    // Salary divided by UMA to find factors
    const salaryUMA = averageSalary / umaValue;

    // Simplified table logic (approximation)
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
      basicPercentage = 0.20; // Flattened for higher salaries, simplified
      incrementPercentage = 0.0245;
    }

    // Topado a 25 UMAS
    const cappedSalary = Math.min(averageSalary, umaValue * 25);

    const basicAmountAnnual = cappedSalary * 365 * basicPercentage;
    const basicAmountMonthly = basicAmountAnnual / 12;

    const extraWeeks = Math.max(0, weeks - 500);
    const incrementYears = Math.floor(extraWeeks / 52);

    const annualIncrementsAmountYearly = cappedSalary * 365 * incrementPercentage * incrementYears;
    const annualIncrementsAmountMonthly = annualIncrementsAmountYearly / 12;

    const subtotal = basicAmountMonthly + annualIncrementsAmountMonthly;

    // Asignaciones familiares
    let familyFactor = 0;
    if (hasSpouse) familyFactor += 0.15;
    familyFactor += (childrenCount * 0.10);

    // Asistencia asistencial si no tiene dependientes (15% por ley)
    if (familyFactor === 0) familyFactor = 0.15;

    const familyAllowancesAmount = subtotal * familyFactor;

    const totalBeforeAge = subtotal + familyAllowancesAmount;

    let monthlyPension = totalBeforeAge * agePercentage;

    // Garantía de pensión mínima (1 salario mínimo mensual aprox)
    const minPension = minWage * 30; // Approx
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
    // Basic estimation for Law 97 (Renta Vitalicia simplified)

    const minWeeksRequired = 875; // For 2026

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

    // Simplificación extrema: Tasa de retiro programado/anualidad aprox 5% anual sobre saldo
    const estimatedAnnualRate = 0.05;
    const estimatedAnnualPension = aforeBalance * estimatedAnnualRate;
    let monthlyPension = estimatedAnnualPension / 12;

    // Garantizada
    const guaranteedPension = minWage * 30; // Approx mínima garantizada

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
    if (!user) {
      if (onRequireLogin) onRequireLogin();
      notify("Regístrate gratis para usar la calculadora", "info");
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
      notify("Cálculo generado exitosamente", "success");
      setTimeout(() => {
        if (typeof resultsRef.current?.scrollIntoView === 'function') {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    if (results.regimeUsed === '1997') {
      return [
        { name: 'Pensión AFORE', value: results.monthlyPension, color: '#0f172a' }
      ];
    }

    return [
      { name: 'Cuantía Básica', value: results.basicAmount, color: '#94a3b8' },
      { name: 'Incrementos Anuales', value: results.annualIncrementsAmount, color: '#64748b' },
      { name: 'Asignaciones Familiares', value: results.familyAllowancesAmount, color: '#d4af37' },
    ].filter(d => d.value > 0);
  }, [results]);

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

      doc.save(`LexLaboral_Pension_${new Date().getTime()}.pdf`);
      notify("PDF generado con éxito", "success");
    } catch (error) {
      notify("Error al generar PDF", "error");
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Calculadora de Pensiones"
        title="Estimación IMSS"
        description="Calcula el estimado de tu pensión mensual bajo el régimen de 1973 o 1997."
        icon={<Building size={28} />}
        actions={
          <div className="flex flex-wrap rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-1.5 shadow-sm">
            {(['1973', '1997'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRegime(r)}
                className={`rounded-[1rem] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-all ${
                  regime === r
                    ? 'bg-slate-950 text-legal-gold shadow-[0_18px_40px_-24px_rgba(15,23,42,0.9)]'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                Ley {r}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-8">
          <WorkspacePanel className="space-y-8 p-8">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="ui-icon-chip h-11 w-11 rounded-[1rem]"><User size={18} className="text-legal-gold" /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Datos de Cotización</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Régimen {regime}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="ui-label">Edad (años)</label>
                  <input type="number" value={age || ''} onChange={(e) => setAge(Number(e.target.value))} className="ui-input-lg w-full px-4" placeholder="60" min="60" />
                </div>
                <div className="space-y-2">
                  <label className="ui-label">Semanas Cotizadas</label>
                  <input type="number" value={weeks || ''} onChange={(e) => setWeeks(Number(e.target.value))} className="ui-input-lg w-full px-4" placeholder="500" />
                </div>
              </div>

              {regime === '1973' ? (
                <div className="ui-subtle-block space-y-4 p-6">
                  <label className="ui-label">Salario Diario Promedio (Últimos 5 años)</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" value={averageSalary || ''} onChange={(e) => setAverageSalary(Number(e.target.value))} className="ui-input-lg w-full pl-10 pr-4" placeholder="0.00" />
                  </div>
                </div>
              ) : (
                <div className="ui-subtle-block space-y-4 p-6">
                  <label className="ui-label">Saldo Acumulado AFORE</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" value={aforeBalance || ''} onChange={(e) => setAforeBalance(Number(e.target.value))} className="ui-input-lg w-full pl-10 pr-4" placeholder="0.00" />
                  </div>
                </div>
              )}

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="ui-subtle-block flex w-full items-center justify-between p-4 text-slate-500 transition-all hover:bg-slate-100">
                <div className="flex items-center gap-3">
                  <Settings2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Configuración Adicional</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ui-subtle-block grid grid-cols-2 gap-6 overflow-hidden p-6">
                    {regime === '1973' && (
                      <>
                        <div className="space-y-2 col-span-2 flex items-center justify-between">
                          <label className="ui-label mb-0">¿Tiene Cónyuge?</label>
                          <input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-legal-gold focus:ring-legal-gold" />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <label className="ui-label">Hijos (menores de 16 o estudiantes hasta 25)</label>
                          <input type="number" value={childrenCount === 0 ? '' : childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value))} className="ui-input w-full px-4 py-3 text-xs" placeholder="0" />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <label className="ui-label">Salario Mínimo</label>
                      <input type="number" value={minWage || ''} onChange={(e) => setMinWage(Number(e.target.value))} className="ui-input w-full px-4 py-3 text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="ui-label">Valor UMA</label>
                      <input type="number" value={umaValue || ''} onChange={(e) => setUmaValue(Number(e.target.value))} className="ui-input w-full px-4 py-3 text-xs" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={calculate} className="w-full py-5 bg-gradient-to-r from-legal-950 to-slate-900 text-legal-gold rounded-[1.5rem] font-bold shadow-2xl shadow-legal-950/20 hover:shadow-legal-950/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden">
                <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <TrendingUp size={20} className="group-hover:translate-x-1 transition-transform" />
                <span className="tracking-wide">Calcular Pensión</span>
              </button>
            </div>
          </WorkspacePanel>
        </div>

        <div ref={resultsRef} className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!results ? (
              <WorkspaceEmpty
                icon={<Building size={44} />}
                title="Estimación de Pensión"
                description="Ingresa tus datos para ver un estimado de tu pensión mensual según la ley seleccionada."
                className="min-h-[600px]"
              />
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <WorkspacePanel className="overflow-hidden rounded-[2.4rem]">
                  <div className="p-10 border-b border-slate-50 bg-gradient-to-br from-slate-900 to-legal-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Pensión Mensual (Aprox)</span>
                      <div className="flex items-baseline gap-3 mt-2">
                        <h3 className="text-5xl font-serif font-bold text-legal-gold">
                          ${results.monthlyPension.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </h3>
                        <span className="text-slate-400 font-bold text-sm">MXN</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleExportPDF} className="flex items-center gap-3 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10 active:scale-95 text-xs">
                        <FileDown size={18} /> <span>PDF</span>
                      </button>
                      <button onClick={() => setResults(null)} className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl transition-all">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-10 border-b md:border-b-0 md:border-r border-slate-50">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Composición</h4>
                      <div className="h-[280px]">
                        <React.Suspense fallback={<div className="h-full rounded-2xl bg-slate-50" />}>
                          <LazyBreakdownChart data={chartData} />
                        </React.Suspense>
                      </div>
                    </div>

                    <div className="p-10 space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Desglose</h4>

                      {results.regimeUsed === '1973' && (
                        <>
                          <div className="group">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-700">Cuantía Básica</span>
                              <span className="text-sm font-serif font-bold text-slate-900">${results.basicAmount.toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono leading-relaxed border border-slate-100 whitespace-pre-wrap">
                              {results.formulas.basic}
                            </div>
                          </div>

                          <div className="group mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-700">Incrementos Anuales</span>
                              <span className="text-sm font-serif font-bold text-slate-900">${results.annualIncrementsAmount.toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono leading-relaxed border border-slate-100 whitespace-pre-wrap">
                              {results.formulas.increments}
                            </div>
                          </div>

                          <div className="group mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-700">Asignaciones Familiares / Asistencial</span>
                              <span className="text-sm font-serif font-bold text-slate-900">${results.familyAllowancesAmount.toLocaleString()}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono leading-relaxed border border-slate-100 whitespace-pre-wrap">
                              {results.formulas.family}
                            </div>
                          </div>

                          <div className="group mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-700">Factor de Edad ({age} años)</span>
                              <span className="text-sm font-serif font-bold text-slate-900">{results.agePercentage}%</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono leading-relaxed border border-slate-100 whitespace-pre-wrap">
                              {results.formulas.ageFactor}
                            </div>
                          </div>
                        </>
                      )}

                      {results.regimeUsed === '1997' && (
                        <div className="group">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-700">Pensión Estimada</span>
                            <span className="text-sm font-serif font-bold text-slate-900">${results.monthlyPension.toLocaleString()}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono leading-relaxed border border-slate-100 whitespace-pre-wrap">
                            {results.formulas.basic}
                          </div>
                        </div>
                      )}

                      <div className="mt-8 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                        <Info size={16} className="text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-orange-800 tracking-wide uppercase">Cálculo Estimado</span>
                          <p className="text-xs text-orange-600/80 mt-1 leading-relaxed">
                            Este resultado es una <strong>estimación</strong>. El cálculo oficial debe ser emitido por el Instituto Mexicano del Seguro Social. Se aplican redondeos y factores simplificados para propósitos ilustrativos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </WorkspacePanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SEOContentSection
        title="Calculadora de Pensiones IMSS (Ley 73 y 97)"
        intro="Estima tu pensión mensual del IMSS según el régimen al que pertenezcas. Si cotizaste antes del 1 de julio de 1997, puedes optar por la Ley del 73; si cotizaste después, te aplica la Ley del 97."
        highlights={[
          {
            title: 'Régimen de 1973',
            body: 'Basado en el promedio de tu salario de los últimos 5 años (250 semanas) y el total de semanas cotizadas. Entre más semanas y mayor salario, mejor pensión.',
          },
          {
            title: 'Régimen de 1997',
            body: 'Tu pensión depende enteramente de los recursos que hayas acumulado en tu cuenta individual de AFORE.',
          },
          {
            title: 'Edad de Retiro',
            body: 'La edad mínima para pensión por cesantía es de 60 años (obteniendo el 75% en Ley 73) y por vejez a los 65 años (100%).',
          },
        ]}
        faqs={[
          {
            question: '¿Qué régimen de pensión me corresponde?',
            answer: 'Si empezaste a cotizar al IMSS antes del 1 de julio de 1997, te corresponde la Ley del 73. Si empezaste después de esa fecha, te corresponde la Ley del 97.',
          },
          {
            question: '¿Cuántas semanas necesito para pensionarme?',
            answer: 'Para la Ley 73 necesitas un mínimo de 500 semanas. Para la Ley 97, en 2026 requieres 875 semanas.',
          }
        ]}
      />
    </WorkspacePage>
  );
};
