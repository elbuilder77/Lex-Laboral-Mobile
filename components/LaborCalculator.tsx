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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { SEOContentSection } from './SEOContentSection';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';

type DismissalType = 'injustificado' | 'renuncia' | 'rescision_patron' | 'rescision_trabajador';

const LazyBreakdownChart = React.lazy(() =>
  import('./BreakdownChart').then((module) => ({ default: module.BreakdownChart }))
);

export const LaborCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
  onRequireLogin?: () => void;
  onOpenDrafting?: () => void;
  onOpenImss?: () => void;
  onOpenPricing?: (plan: 'draft_basic' | 'mensualidad' | 'trimestralidad') => void;
}> = ({ notify, onRequireLogin, onOpenDrafting, onOpenImss, onOpenPricing }) => {
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const dismissalOptions: Array<{ value: DismissalType; label: string }> = [
    { value: 'injustificado', label: 'Injustificado' },
    { value: 'renuncia', label: 'Renuncia' },
    { value: 'rescision_patron', label: 'Rescisión' },
  ];
  const { user, access } = useAuth();
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
    if (!user) {
      if (onRequireLogin) onRequireLogin();
      notify("Regístrate gratis para usar la calculadora", "info");
      return;
    }

    if (dailySalary <= 0 || (yearsOfService <= 0 && daysOfService <= 0)) {
      setShowErrors(true);
      notify("Complete los campos obligatorios para generar el cálculo", "warning");
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

    setResults({
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
    });
    
    notify("Cálculo generado exitosamente", "success");
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

      doc.save(`LexLaboral_Dictamen_${new Date().getTime()}.pdf`);
      notify("PDF generado con éxito", "success");
    } catch (error) {
      notify("Error al generar PDF", "error");
    }
  };

  const handleDraftingNextStep = () => {
    if (access.hasActiveSubscription || access.singleDocumentUsesRemaining > 0) {
      onOpenDrafting?.();
      return;
    }

    onOpenPricing?.('draft_basic');
  };

  const handleImssNextStep = () => {
    if (access.hasActiveSubscription) {
      onOpenImss?.();
      return;
    }

    onOpenPricing?.('mensualidad');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-slate-950 px-6 pt-12 pb-6 shadow-md rounded-b-[2rem]">
        <h1 className="text-2xl font-serif font-bold text-white">Liquidación y Finiquito</h1>
        <p className="text-sm text-slate-400 mt-1">Simula escenarios conforme a la LFT</p>
        
        {/* Android Native-like Tabs */}
        <div className="flex bg-slate-900 rounded-full p-1 mt-6 border border-slate-800">
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
              {/* Card: Tipo de Despido */}
              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Motivo de Separación</label>
                <div className="grid grid-cols-1 gap-2">
                  {dismissalOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDismissalType(option.value)}
                      className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                        dismissalType === option.value
                          ? 'bg-slate-950 border-slate-950 text-legal-gold font-bold shadow-md'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card: Salario */}
              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salario Base</label>
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((p) => (
                      <button 
                        key={p} 
                        onClick={() => setSalaryPeriod(p)} 
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all ${salaryPeriod === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                      >
                        {p === 'daily' ? 'Diario' : p === 'weekly' ? 'Sem' : p === 'biweekly' ? 'Quin' : 'Mes'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input type="number" value={baseSalary || ''} onChange={(e) => setBaseSalary(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 text-slate-900 font-bold focus:border-legal-gold focus:ring-1 outline-none transition-all" placeholder="0.00" />
                </div>
                {isSdiCalculated && baseSalary > 0 && (
                  <div className="mt-3 flex justify-between items-center bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-xs font-bold border border-emerald-100">
                    <span>SDI Integrado</span>
                    <span>${dailySalary.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Card: Fechas */}
              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingreso</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baja</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none" />
                </div>
              </div>

              {/* Card: Opciones Avanzadas */}
              <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full p-5 flex items-center justify-between text-slate-500 hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Settings2 size={16}/> Avanzado</span>
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-5 grid grid-cols-2 gap-4">
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
              </div>

              {/* Sticky FAB para Calcular */}
              <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-0 w-full px-4 z-40 md:relative md:bottom-auto md:px-0 mt-6">
                <button onClick={calculate} className="w-full py-5 bg-gradient-to-r from-slate-950 to-slate-900 text-legal-gold rounded-[2rem] font-bold shadow-2xl shadow-slate-950/40 flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 active:opacity-100 transition-opacity" />
                  <Calculator size={20} />
                  <span className="uppercase tracking-widest text-sm">Calcular Liquidación</span>
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
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={handleDraftingNextStep} className="bg-blue-900 rounded-[1.5rem] p-5 text-left shadow-md relative overflow-hidden flex items-center justify-between active:scale-95 transition-all">
                      <div>
                        <h4 className="text-white font-bold text-base flex items-center gap-2"><Sparkles className="text-legal-gold" size={16} /> Generar Documento</h4>
                        <p className="text-blue-200 text-xs mt-1">Descarga el convenio o renuncia.</p>
                      </div>
                      <ArrowRight size={20} className="text-blue-200" />
                    </button>
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
