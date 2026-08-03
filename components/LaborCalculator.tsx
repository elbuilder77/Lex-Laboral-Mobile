import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Coins, 
  Calendar, 
  Briefcase, 
  Info, 
  Download, 
  RefreshCw, 
  Scale, 
  Zap, 
  AlertCircle,
  ChevronDown,
  TrendingUp,
  FileText,
  User,
  FileDown,
  CheckCircle2,
  Settings2,
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { CALCULATION_STORAGE_KEYS, loadCalculationSnapshot, saveCalculationSnapshot } from '../lib/calculation-storage';
import { exportPdf } from '../lib/pdf-export';

type DismissalType = 'injustificado' | 'renuncia' | 'rescision_patron' | 'rescision_trabajador';

const LazyBreakdownChart = React.lazy(() =>
  import('./BreakdownChart').then((module) => ({ default: module.BreakdownChart }))
);

export const LaborCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
}> = ({ notify }) => {
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const dismissalOptions: Array<{ value: DismissalType; label: string }> = [
    { value: 'injustificado', label: 'Despido injustificado' },
    { value: 'renuncia', label: 'Renuncia voluntaria' },
    { value: 'rescision_patron', label: 'Rescisión por el patrón' },
  ];
  const [dailySalary, setDailySalary] = useState<number>(0);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [salaryPeriod, setSalaryPeriod] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [isSdiCalculated, setIsSdiCalculated] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [yearsOfService, setYearsOfService] = useState<number>(0);
  const [daysOfService, setDaysOfService] = useState<number>(0);
  const [vacationDays, setVacationDays] = useState<number>(12);
  const [vacationPremium, setVacationPremium] = useState<number>(25);
  const [aguinaldoDays, setAguinaldoDays] = useState<number>(15);
  const [doubleOvertimeHours, setDoubleOvertimeHours] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);
  const [tripleOvertimeHours, setTripleOvertimeHours] = useState<number>(0);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [dismissalType, setDismissalType] = useState<DismissalType>('injustificado');
  const [minWage, setMinWage] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.minWage);
  const [umaValue, setUmaValue] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.uma);
  const [showErrors, setShowErrors] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form');

  React.useEffect(() => {
    if (baseSalary > 0) {
      let daily = 0;
      if (salaryPeriod === 'daily') daily = baseSalary;
      else if (salaryPeriod === 'weekly') daily = baseSalary / 7;
      else if (salaryPeriod === 'biweekly') daily = baseSalary / 15;
      else if (salaryPeriod === 'monthly') daily = baseSalary / 30;

      const factor = 1 + (aguinaldoDays / 365.25) + (vacationDays * (vacationPremium / 100) / 365.25);
      const sdi = daily * factor;
      setDailySalary(Math.round(sdi * 100) / 100);
      setIsSdiCalculated(true);
    }
  }, [baseSalary, salaryPeriod, aguinaldoDays, vacationDays, vacationPremium]);

  React.useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const years = Math.floor(totalDays / 365.25);
        const remainingDays = Math.floor(totalDays % 365.25);
        
        setYearsOfService(years);
        setDaysOfService(remainingDays);
      } else {
        setYearsOfService(0);
        setDaysOfService(0);
      }
    }
  }, [startDate, endDate]);

  const [results, setResults] = useState<{
    aguinaldo: number;
    vacations: number;
    vacationPremium: number;
    indemnity90: number;
    indemnity20: number;
    seniorityPremium: number;
    overtime: number;
    total: number;
    finiquito: number;
    liquidacion: number;
    isr: number;
    formulas: {
      aguinaldo: string;
      vacations: string;
      vacationPremium: string;
      indemnity90: string;
      indemnity20: string;
      seniorityPremium: string;
      overtime: string;
      isr: string;
    };
  } | null>(null);

  React.useEffect(() => {
    const saved = loadCalculationSnapshot<{
      baseSalary: number; salaryPeriod: typeof salaryPeriod; dailySalary: number; startDate: string;
      endDate: string; yearsOfService: number; daysOfService: number; dismissalType: DismissalType;
    }, NonNullable<typeof results>>(CALCULATION_STORAGE_KEYS.labor);
    if (!saved?.results) return;
    setBaseSalary(saved.inputs.baseSalary ?? 0);
    setSalaryPeriod(saved.inputs.salaryPeriod ?? 'monthly');
    setDailySalary(saved.inputs.dailySalary ?? 0);
    setStartDate(saved.inputs.startDate ?? '');
    setEndDate(saved.inputs.endDate ?? '');
    setYearsOfService(saved.inputs.yearsOfService ?? 0);
    setDaysOfService(saved.inputs.daysOfService ?? 0);
    setDismissalType(saved.inputs.dismissalType ?? 'injustificado');
    setResults(saved.results);
    setActiveTab('results');
  }, []);

  const calculateMonthlyISR = (amount: number): number => {
    const limits = [
      { lower: 0.01, upper: 746.04, fixed: 0, percent: 0.0192 },
      { lower: 746.05, upper: 6332.05, fixed: 14.32, percent: 0.064 },
      { lower: 6332.06, upper: 11128.01, fixed: 371.83, percent: 0.1088 },
      { lower: 11128.02, upper: 12935.82, fixed: 893.63, percent: 0.16 },
      { lower: 12935.83, upper: 15487.71, fixed: 1182.88, percent: 0.1792 },
      { lower: 15487.72, upper: 31236.49, fixed: 1640.18, percent: 0.2136 },
      { lower: 31236.50, upper: 49233.00, fixed: 5004.12, percent: 0.2352 },
      { lower: 49233.01, upper: 93993.90, fixed: 9236.89, percent: 0.30 },
      { lower: 93993.91, upper: 125325.20, fixed: 22665.17, percent: 0.32 },
      { lower: 125325.21, upper: 375975.61, fixed: 32691.18, percent: 0.34 },
      { lower: 375975.62, upper: 9999999, fixed: 117912.32, percent: 0.35 }
    ];
    const bracket = limits.find(l => amount >= l.lower && amount <= l.upper) || limits[0];
    return bracket.fixed + ((amount - bracket.lower) * bracket.percent);
  };

  const calculate = async () => {
    if (dailySalary <= 0 || (yearsOfService <= 0 && daysOfService <= 0)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);

    const totalYears = yearsOfService + (daysOfService / 365.25);
    const hourlyRate = dailySalary / hoursPerDay;
    
    const proportionOfYear = daysOfService / 365.25;
    const aguinaldo = (dailySalary * aguinaldoDays) * proportionOfYear;
    const vacations = (dailySalary * vacationDays) * proportionOfYear;
    const vPremium = vacations * (vacationPremium / 100);
    const overtimeDouble = doubleOvertimeHours * (hourlyRate * 2);
    const overtimeTriple = tripleOvertimeHours * (hourlyRate * 3);
    const totalOvertime = overtimeDouble + overtimeTriple;

    const finiquito = aguinaldo + vacations + vPremium + totalOvertime;

    let indemnity90 = 0;
    let indemnity20 = 0;
    let seniorityPremium = 0;

    const cappedSalary = Math.min(dailySalary, minWage * 2);
    const shouldPaySeniority = dismissalType !== 'renuncia' || (dismissalType === 'renuncia' && yearsOfService >= 15);

    if (shouldPaySeniority) {
      seniorityPremium = (cappedSalary * 12) * totalYears;
    }

    if (dismissalType === 'injustificado' || dismissalType === 'rescision_trabajador') {
      indemnity90 = dailySalary * 90;
      indemnity20 = (dailySalary * 20) * totalYears;
    }

    const liquidacion = indemnity90 + indemnity20 + seniorityPremium;
    
    const aguinaldoExento = Math.min(aguinaldo, 30 * umaValue);
    const primaVacacionalExenta = Math.min(vPremium, 15 * umaValue);
    const baseGravableFiniquito = Math.max(0, (aguinaldo - aguinaldoExento) + vacations + (vPremium - primaVacacionalExenta) + totalOvertime);
    const isrFiniquito = calculateMonthlyISR(baseGravableFiniquito);

    const exentoLiquidacion = 90 * umaValue * Math.floor(totalYears);
    const baseGravableLiquidacion = Math.max(0, liquidacion - exentoLiquidacion);

    const sueldoMensual = dailySalary * 30.4;
    const isrSueldoMensual = calculateMonthlyISR(sueldoMensual);
    const tasaEfectiva = sueldoMensual > 0 ? (isrSueldoMensual / sueldoMensual) : 0;
    
    const isrLiquidacion = baseGravableLiquidacion * tasaEfectiva;
    const totalISR = isrFiniquito + isrLiquidacion;

    const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    const calculatedResults = {
      aguinaldo: round(aguinaldo),
      vacations: round(vacations),
      vacationPremium: round(vPremium),
      indemnity90: round(indemnity90),
      indemnity20: round(indemnity20),
      seniorityPremium: round(seniorityPremium),
      overtime: round(totalOvertime),
      finiquito: round(finiquito),
      liquidacion: round(liquidacion),
      isr: round(totalISR),
      total: round(finiquito + liquidacion - totalISR),
      formulas: {
        aguinaldo: `Salario Diario: $${dailySalary.toFixed(2)}\nDías: ${aguinaldoDays}\n$${dailySalary.toFixed(2)} × ${aguinaldoDays} × ${(proportionOfYear).toFixed(2)} = $${round(aguinaldo).toFixed(2)}`,
        vacations: `Salario Diario: $${dailySalary.toFixed(2)}\nDías: ${vacationDays}\n$${dailySalary.toFixed(2)} × ${vacationDays} × ${(proportionOfYear).toFixed(2)} = $${round(vacations).toFixed(2)}`,
        vacationPremium: `Monto: $${round(vacations).toFixed(2)} × ${(vacationPremium / 100).toFixed(2)} = $${round(vPremium).toFixed(2)}`,
        indemnity90: `Salario Diario: $${dailySalary.toFixed(2)} × 90 = $${round(indemnity90).toFixed(2)}`,
        indemnity20: `Salario Diario: $${dailySalary.toFixed(2)} × 20 × ${totalYears.toFixed(2)} años = $${round(indemnity20).toFixed(2)}`,
        seniorityPremium: `Topado (Max 2 SMG): $${cappedSalary.toFixed(2)} × 12 × ${totalYears.toFixed(2)} años = $${round(seniorityPremium).toFixed(2)}`,
        overtime: `Salario por hora: $${hourlyRate.toFixed(2)} ($${(hourlyRate * 2).toFixed(2)}/hr x ${doubleOvertimeHours}) = $${round(totalOvertime).toFixed(2)}`,
        isr: `Base Gravable Finiquito: $${baseGravableFiniquito.toFixed(2)}\nISR Finiquito: $${isrFiniquito.toFixed(2)}\nBase Liq: $${baseGravableLiquidacion.toFixed(2)} (Tasa: ${(tasaEfectiva * 100).toFixed(2)}%)\nISR Liquidación: $${isrLiquidacion.toFixed(2)}\nRetención Total: $${totalISR.toFixed(2)}`,
      }
    };
    setResults(calculatedResults);
    saveCalculationSnapshot(CALCULATION_STORAGE_KEYS.labor, {
      savedAt: new Date().toISOString(),
      inputs: { baseSalary, salaryPeriod, dailySalary, startDate, endDate, yearsOfService, daysOfService, dismissalType },
      results: calculatedResults,
    });
    
    setActiveTab('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    return [
      { name: 'Aguinaldo', value: results.aguinaldo, color: '#94a3b8' },
      { name: 'Vacaciones', value: results.vacations, color: '#64748b' },
      { name: 'Prima Vac.', value: results.vacationPremium, color: '#475569' },
      { name: 'Indemnización 90', value: results.indemnity90, color: '#d4af37' },
      { name: 'Indemnización 20', value: results.indemnity20, color: '#b8962e' },
      { name: 'Prima Antig.', value: results.seniorityPremium, color: '#1e293b' },
      { name: 'Horas Extras', value: results.overtime, color: '#0f172a' },
      { name: 'Retención ISR', value: results.isr, color: '#991b1b' },
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
      doc.text('DICTAMEN TÉCNICO DE LIQUIDACIÓN LABORAL', 20, 32);
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 50);
      doc.text(`Tipo: ${dismissalType.toUpperCase().replace('_', ' ')}`, 20, 50);

      autoTable(doc, {
        startY: 60,
        head: [['Concepto', 'Valor']],
        body: [
          ['Fecha de Ingreso', startDate || 'No especificada'],
          ['Fecha de Baja', endDate || 'No especificada'],
          ['Antigüedad', `${yearsOfService} años, ${daysOfService} días`],
          ['SDI Integrado', `$${dailySalary.toFixed(2)}`],
          ['Salario Mínimo', `$${minWage.toFixed(2)}`],
        ],
        headStyles: { fillColor: primaryColor },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Prestación', 'Monto (MXN)', 'Fundamento']],
        body: [
          ['Aguinaldo Proporcional', `$${results.aguinaldo.toFixed(2)}`, 'Art. 87 LFT'],
          ['Vacaciones Proporcionales', `$${results.vacations.toFixed(2)}`, 'Art. 76 LFT'],
          ['Prima Vacacional', `$${results.vacationPremium.toFixed(2)}`, 'Art. 80 LFT'],
          ['Indemnización 90 días', `$${results.indemnity90.toFixed(2)}`, 'Art. 48 LFT'],
          ['Indemnización 20 días/año', `$${results.indemnity20.toFixed(2)}`, 'Art. 50 LFT'],
          ['Prima de Antigüedad', `$${results.seniorityPremium.toFixed(2)}`, 'Art. 162 LFT'],
          ['Retención ISR (Estimada)', `-$${results.isr.toFixed(2)}`, 'Art. 95, 96 LISR'],
        ].filter(r => parseFloat(r[1].replace('$', '').replace('-', '')) > 0),
        headStyles: { fillColor: goldColor, textColor: [0, 0, 0] },
      });

      await exportPdf(doc, `LexLaboral_Dictamen_${new Date().getTime()}.pdf`, 'Liquidación laboral');
      notify("PDF generado con éxito", "success");
    } catch (error) {
      notify("Error al generar PDF", "error");
    }
  };

  return (
    <div className="min-h-full bg-[#fbfaf7] pb-24 text-slate-950">
      <div className="flex min-h-[64px] items-center justify-between bg-[#070d1c] px-5 py-2 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/assets/icon-mobile.png" alt="Logo de Lex Laboral" className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-legal-gold/40 shadow-lg" />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-legal-gold">Lex Laboral</p>
            <p className="truncate text-[10px] text-slate-300">Sistema de Inteligencia Jurídica</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'form' ? 'results' : 'form')}
          className="ml-3 flex h-11 shrink-0 items-center rounded-xl border border-white/15 px-3 text-xs font-semibold text-slate-200"
        >
          {activeTab === 'form' ? 'Resultados' : 'Formulario'}
        </button>
      </div>

      <div className="mx-auto w-full max-w-lg px-5 pt-5">
        <div className="mb-5">
          <h1 className="font-serif text-[clamp(1.9rem,8vw,2.65rem)] font-bold leading-[1.05] tracking-[-0.025em] text-[#070d1c]">
            Liquidación y finiquito
          </h1>
          <p className="mt-2 max-w-sm text-[14px] leading-5 text-slate-600">
            Calcula una estimación de tus prestaciones e indemnizaciones.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-transparent"
            >
              <section className="pb-5 pt-2">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-legal-gold text-base font-bold text-white">1</span>
                  <label htmlFor="dismissal-type" className="text-[16px] font-bold">Motivo de separación</label>
                </div>
                <div className="relative">
                  <select
                    id="dismissal-type"
                    value={dismissalType}
                    onChange={(event) => setDismissalType(event.target.value as DismissalType)}
                    className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-12 text-[15px] font-medium outline-none transition focus:border-legal-gold focus:ring-4 focus:ring-legal-gold/10"
                  >
                    {dismissalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                </div>
              </section>

              <section className="border-t border-[#e4e0d7] py-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-legal-gold text-base font-bold text-white">2</span>
                  <label htmlFor="base-salary" className="text-[16px] font-bold">Salario base</label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-slate-900">$</span>
                  <input id="base-salary" inputMode="decimal" type="number" value={baseSalary || ''} onChange={(e) => setBaseSalary(Number(e.target.value))} aria-invalid={showErrors && dailySalary <= 0} aria-describedby={showErrors && dailySalary <= 0 ? 'base-salary-error' : undefined} className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-lg font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-legal-gold focus:ring-4 focus:ring-legal-gold/10" placeholder="0.00" />
                </div>
                {showErrors && dailySalary <= 0 && (
                  <p id="base-salary-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">Ingresa un salario mayor a cero.</p>
                )}
                <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-xl border border-slate-300">
                    {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((p) => (
                      <button 
                        key={p} 
                        onClick={() => setSalaryPeriod(p)} 
                        className={`min-h-11 border-r border-slate-300 px-1 text-[clamp(0.68rem,3vw,0.82rem)] font-semibold last:border-r-0 ${salaryPeriod === p ? 'bg-[#070d1c] text-legal-gold' : 'bg-white text-slate-900'}`}
                      >
                        {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : p === 'biweekly' ? 'Quincenal' : 'Mensual'}
                      </button>
                    ))}
                </div>
                {isSdiCalculated && baseSalary > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                    <span>SDI Integrado</span>
                    <span>${dailySalary.toFixed(2)}</span>
                  </div>
                )}
              </section>

              <section className="border-t border-[#e4e0d7] py-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-legal-gold text-base font-bold text-white">3</span>
                  <h2 className="text-[16px] font-bold">Fechas</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0 space-y-2">
                    <label htmlFor="employment-start-date" className="block text-[13px] font-semibold text-slate-700">Fecha de ingreso</label>
                    <input id="employment-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-invalid={showErrors && (yearsOfService <= 0 && daysOfService <= 0)} className="h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-legal-gold" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <label htmlFor="employment-end-date" className="block text-[13px] font-semibold text-slate-700">Fecha de baja</label>
                    <input id="employment-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={showErrors && (yearsOfService <= 0 && daysOfService <= 0)} aria-describedby={showErrors && (yearsOfService <= 0 && daysOfService <= 0) ? 'employment-dates-error' : undefined} className="h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-legal-gold" />
                  </div>
                </div>
                {showErrors && (yearsOfService <= 0 && daysOfService <= 0) && (
                  <p id="employment-dates-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">Selecciona fechas válidas; la baja debe ser posterior al ingreso.</p>
                )}

                <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl border border-dashed border-slate-300 px-4 text-slate-700 transition-colors hover:bg-slate-50">
                  <span className="flex items-center gap-2 text-sm font-semibold"><Settings2 size={17}/> Prestaciones y parámetros</span>
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 grid grid-cols-2 gap-3 overflow-hidden">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aguinaldo</label>
                        <input type="number" value={aguinaldoDays} onChange={(e) => setAguinaldoDays(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacaciones</label>
                        <input type="number" value={vacationDays} onChange={(e) => setVacationDays(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <div className="border-t border-[#e4e0d7] pb-5 pt-5">
                <button onClick={calculate} className="flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-legal-gold px-4 text-[15px] font-bold text-[#070d1c] shadow-sm transition active:scale-[0.98]">
                  <Calculator size={21} />
                  <span>Calcular estimación</span>
                </button>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4 pb-8"
            >
              {!results ? (
                <div className="text-center py-20 bg-white rounded-[1.5rem] border border-slate-100">
                  <Calculator size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-serif font-bold text-xl text-slate-900">Calculadora Vacía</h3>
                  <p className="text-sm text-slate-500 mt-2">Vuelve al formulario para ingresar datos.</p>
                  <button onClick={() => setActiveTab('form')} className="mt-6 px-6 py-3 bg-slate-950 text-white rounded-full text-xs font-bold uppercase tracking-widest">Llenar Formulario</button>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-legal-gold/10 rounded-full blur-3xl" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-legal-gold">Total Estimado</span>
                    <div className="mt-3 text-5xl font-serif font-bold text-legal-gold flex items-baseline gap-2">
                      ${results.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      <span className="text-sm font-sans text-slate-400">MXN</span>
                    </div>
                    
                    <div className="mt-8 flex gap-3">
                      <button onClick={handleExportPDF} className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
                        <FileDown size={16} /> Descargar PDF
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Desglose Detallado</h4>
                    <div className="space-y-4">
                      {[
                        { key: 'aguinaldo', label: 'Aguinaldo', val: results.aguinaldo, f: results.formulas.aguinaldo },
                        { key: 'vacations', label: 'Vacaciones', val: results.vacations, f: results.formulas.vacations },
                        { key: 'vacationPremium', label: 'Prima Vac.', val: results.vacationPremium, f: results.formulas.vacationPremium },
                        { key: 'indemnity90', label: 'Indemnización 90', val: results.indemnity90, f: results.formulas.indemnity90 },
                        { key: 'indemnity20', label: 'Indemnización 20', val: results.indemnity20, f: results.formulas.indemnity20 },
                        { key: 'seniorityPremium', label: 'Prima Antigüedad', val: results.seniorityPremium, f: results.formulas.seniorityPremium },
                      ].filter(i => i.val > 0).map(item => (
                        <div key={item.key} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                            <span className="text-base font-serif font-bold text-slate-900">${item.val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400 font-mono">
                            {item.f.replace(/\n/g, ' • ')}
                          </div>
                        </div>
                      ))}
                      {results.isr > 0 && (
                        <div className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-red-600">Retención ISR</span>
                            <span className="text-base font-serif font-bold text-red-600">-${results.isr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      )}
                    </div>
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
