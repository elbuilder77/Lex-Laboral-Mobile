import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Download, 
  Settings2,
  ChevronDown
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { CALCULATION_STORAGE_KEYS, loadCalculationSnapshot, saveCalculationSnapshot } from '../lib/calculation-storage';

export const SocialSecurityCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
}> = ({ notify }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form');

  const [sbc, setSbc] = useState<number>(0);
  const [riskClass, setRiskClass] = useState<number>(0); 
  const [days, setDays] = useState<number>(30);
  
  const [showRiskCalc, setShowRiskCalc] = useState(false);
  const [s_days, setS_days] = useState<number>(0); 
  const [v_factor, setV_factor] = useState<number>(28); 
  const [i_disability, setI_disability] = useState<number>(0); 
  const [d_deaths, setD_deaths] = useState<number>(0); 
  const [f_factor, setF_factor] = useState<number>(2.3); 
  const [n_workers, setN_workers] = useState<number>(1); 
  const [m_min, setM_min] = useState<number>(0.0050); 
  
  const [umaValue, setUmaValue] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.uma);
  const [minWage, setMinWage] = useState<number>(MEXICO_LABOR_DEFAULTS_2026.minWage);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [results, setResults] = useState<{
    employer: {
      fixed: number;
      excedente: number;
      dinero: number;
      pensionados: number;
      invalidez: number;
      guarderia: number;
      riesgo: number;
      retiro: number;
      cesantia: number;
      infonavit: number;
      total: number;
    };
    employee: {
      excedente: number;
      dinero: number;
      pensionados: number;
      invalidez: number;
      cesantia: number;
      total: number;
    };
    total: number;
  } | null>(null);

  React.useEffect(() => {
    const saved = loadCalculationSnapshot<{
      sbc: number; riskClass: number; days: number;
    }, NonNullable<typeof results>>(CALCULATION_STORAGE_KEYS.socialSecurity);
    if (!saved?.results) return;
    setSbc(saved.inputs.sbc ?? 0);
    setRiskClass(saved.inputs.riskClass ?? 0);
    setDays(saved.inputs.days ?? 30);
    setResults(saved.results);
    setActiveTab('results');
  }, []);

  const calculate = async () => {
    if (sbc <= 0) {
      notify("El Salario Base de Cotización debe ser un número positivo", "error");
      return;
    }
    if (sbc < minWage) {
      notify(`El SBC no puede ser menor al salario mínimo ($${minWage})`, "warning");
      return;
    }
    if (riskClass === 0) {
      notify("Por favor, seleccione una Clase de Riesgo", "error");
      return;
    }

    const fixed = (umaValue * 0.204) * days;
    const excedenteBase = Math.max(0, sbc - (3 * umaValue));
    const empExcedente = (excedenteBase * 0.011) * days;
    const empDinero = (sbc * 0.007) * days;
    const empPensionados = (sbc * 0.0105) * days;
    const empInvalidez = (sbc * 0.0175) * days;
    const empGuarderia = (sbc * 0.01) * days;
    const empRiesgo = (sbc * (riskClass / 100)) * days;
    const empRetiro = (sbc * 0.02) * days;
    
    const ratio = sbc / umaValue;
    let cesantiaRate = 0.0315; 
    
    if (sbc > minWage) {
      if (ratio <= 1.50) cesantiaRate = 0.03676;
      else if (ratio <= 2.00) cesantiaRate = 0.04851;
      else if (ratio <= 2.50) cesantiaRate = 0.05556;
      else if (ratio <= 3.00) cesantiaRate = 0.06026;
      else if (ratio <= 3.50) cesantiaRate = 0.06361;
      else if (ratio <= 4.00) cesantiaRate = 0.06613;
      else cesantiaRate = 0.07513; 
    }
    
    const empCesantia = (sbc * cesantiaRate) * days;
    const empInfonavit = (sbc * 0.05) * days;

    const empTotal = fixed + empExcedente + empDinero + empPensionados + empInvalidez + empGuarderia + empRiesgo + empRetiro + empCesantia + empInfonavit;

    const workerExcedente = (excedenteBase * 0.004) * days;
    const workerDinero = (sbc * 0.0025) * days;
    const workerPensionados = (sbc * 0.00375) * days;
    const workerInvalidez = (sbc * 0.00625) * days;
    const workerCesantia = (sbc * 0.01125) * days;

    const workerTotal = workerExcedente + workerDinero + workerPensionados + workerInvalidez + workerCesantia;

    const calculatedResults = {
      employer: {
        fixed,
        excedente: empExcedente,
        dinero: empDinero,
        pensionados: empPensionados,
        invalidez: empInvalidez,
        guarderia: empGuarderia,
        riesgo: empRiesgo,
        retiro: empRetiro,
        cesantia: empCesantia,
        infonavit: empInfonavit,
        total: empTotal
      },
      employee: {
        excedente: workerExcedente,
        dinero: workerDinero,
        pensionados: workerPensionados,
        invalidez: workerInvalidez,
        cesantia: workerCesantia,
        total: workerTotal
      },
      total: empTotal + workerTotal
    };
    setResults(calculatedResults);
    saveCalculationSnapshot(CALCULATION_STORAGE_KEYS.socialSecurity, {
      savedAt: new Date().toISOString(),
      inputs: { sbc, riskClass, days },
      results: calculatedResults,
    });

    notify("Cálculo finalizado", "success");
    setActiveTab('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateAnnualRisk = () => {
    if (n_workers <= 0) {
      notify("El número de trabajadores debe ser mayor a 0", "error");
      return;
    }
    const calculatedRisk = (((s_days / 365) + v_factor * (i_disability + d_deaths)) * (f_factor / n_workers)) + m_min;
    setRiskClass(Number((calculatedRisk * 100).toFixed(5)));
    setShowRiskCalc(false);
    notify(`Nueva Prima de Riesgo: ${(calculatedRisk * 100).toFixed(5)}%`, "success");
  };

  const handleExport = () => {
    if (!results) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Cálculo de Cuotas IMSS / INFONAVIT', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`SBC (Salario Base Cotización): $${sbc.toFixed(2)}`, 14, 32);
    doc.text(`Días Cotizados: ${days}`, 14, 38);
    doc.text(`Clase de Riesgo: ${riskClass}%`, 14, 44);
    
    autoTable(doc, {
      startY: 54,
      head: [['Concepto', 'Patrón', 'Trabajador', 'Total']],
      body: [
        ['Enf. y Mat. (Cuota Fija)', `$${results.employer.fixed.toFixed(2)}`, '$0.00', `$${results.employer.fixed.toFixed(2)}`],
        ['Enf. y Mat. (Excedente)', `$${results.employer.excedente.toFixed(2)}`, `$${results.employee.excedente.toFixed(2)}`, `$${(results.employer.excedente + results.employee.excedente).toFixed(2)}`],
        ['Enf. y Mat. (Prest. Dinero)', `$${results.employer.dinero.toFixed(2)}`, `$${results.employee.dinero.toFixed(2)}`, `$${(results.employer.dinero + results.employee.dinero).toFixed(2)}`],
        ['Enf. y Mat. (Gastos Méd.)', `$${results.employer.pensionados.toFixed(2)}`, `$${results.employee.pensionados.toFixed(2)}`, `$${(results.employer.pensionados + results.employee.pensionados).toFixed(2)}`],
        ['Invalidez y Vida', `$${results.employer.invalidez.toFixed(2)}`, `$${results.employee.invalidez.toFixed(2)}`, `$${(results.employer.invalidez + results.employee.invalidez).toFixed(2)}`],
        ['Riesgos de Trabajo', `$${results.employer.riesgo.toFixed(2)}`, '$0.00', `$${results.employer.riesgo.toFixed(2)}`],
        ['Guarderías y Prest.', `$${results.employer.guarderia.toFixed(2)}`, '$0.00', `$${results.employer.guarderia.toFixed(2)}`],
        ['Retiro', `$${results.employer.retiro.toFixed(2)}`, '$0.00', `$${results.employer.retiro.toFixed(2)}`],
        ['Cesantía y Vejez', `$${results.employer.cesantia.toFixed(2)}`, `$${results.employee.cesantia.toFixed(2)}`, `$${(results.employer.cesantia + results.employee.cesantia).toFixed(2)}`],
        ['INFONAVIT 5%', `$${results.employer.infonavit.toFixed(2)}`, '$0.00', `$${results.employer.infonavit.toFixed(2)}`],
      ],
      foot: [[
        'Total', 
        `$${results.employer.total.toFixed(2)}`, 
        `$${results.employee.total.toFixed(2)}`, 
        `$${results.total.toFixed(2)}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      footStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    doc.save('Cuotas_IMSS.pdf');
    notify('PDF generado correctamente', 'success');
  };

  return (
    <div className="min-h-full bg-[#fbfaf7] pb-24">
      <div className="bg-[#070d1c] px-5 pb-4 pt-5 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/assets/icon-mobile.png" alt="Logo de Lex Laboral" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-legal-gold/40 shadow-lg" />
          <div><h1 className="text-2xl font-serif font-bold text-white">IMSS e INFONAVIT</h1><p className="mt-1 text-sm text-slate-400">Cuotas obrero-patronales</p></div>
        </div>
        
        {/* Tabs */}
        <div className="mt-5 flex rounded-xl border border-slate-700 bg-slate-900 p-1">
          <button 
            onClick={() => setActiveTab('form')}
            className={`min-h-11 flex-1 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'form' ? 'bg-legal-gold text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Formulario
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`min-h-11 flex-1 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'results' ? 'bg-legal-gold text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resultados
          </button>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-lg px-4">
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Salario Base de Cotización (SBC)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input type="number" value={sbc || ''} onChange={(e) => setSbc(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 text-slate-900 font-bold focus:border-legal-gold outline-none" placeholder="0.00" />
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Días</label>
                  <input type="number" value={days || ''} onChange={(e) => setDays(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Riesgo (%)</label>
                  <select value={riskClass} onChange={(e) => setRiskClass(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none">
                    <option value={0}>Seleccione...</option>
                    <option value={0.54355}>Clase I (0.54)</option>
                    <option value={1.13065}>Clase II (1.13)</option>
                    <option value={2.59840}>Clase III (2.59)</option>
                    <option value={4.65325}>Clase IV (4.65)</option>
                    <option value={7.58875}>Clase V (7.58)</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full p-5 flex items-center justify-between text-slate-500 hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Settings2 size={16}/> Constantes 2026</span>
                  <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 pb-5 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMG</label>
                        <input type="number" value={minWage || ''} onChange={(e) => setMinWage(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UMA</label>
                        <input type="number" value={umaValue || ''} onChange={(e) => setUmaValue(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-3 text-sm text-slate-900 font-bold" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-0 w-full px-4 z-40 md:relative md:bottom-auto md:px-0 mt-6">
                <button onClick={calculate} className="w-full py-5 bg-gradient-to-r from-slate-950 to-slate-900 text-legal-gold rounded-[2rem] font-bold shadow-2xl shadow-slate-950/40 flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 active:opacity-100 transition-opacity" />
                  <TrendingUp size={20} />
                  <span className="uppercase tracking-widest text-sm">Calcular Cuotas</span>
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
                  <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-serif font-bold text-xl text-slate-900">Sin Datos</h3>
                  <p className="text-sm text-slate-500 mt-2">Completa el formulario para ver la proyección.</p>
                  <button onClick={() => setActiveTab('form')} className="mt-6 px-6 py-3 bg-slate-950 text-white rounded-full text-xs font-bold uppercase tracking-widest">Ir al Formulario</button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 rounded-[1.5rem] p-5 shadow-md">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Patrón</span>
                      <div className="text-xl font-serif font-bold text-white mt-1">${results.employer.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                    <div className="bg-legal-gold/10 border border-legal-gold/20 rounded-[1.5rem] p-5 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-legal-gold">Trabajador</span>
                      <div className="text-xl font-serif font-bold text-slate-900 mt-1">${results.employee.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-legal-gold">Total Obrero-Patronal</span>
                    <div className="mt-3 text-4xl font-serif font-bold text-legal-gold">
                      ${results.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    
                    <button onClick={handleExport} className="mt-6 w-full bg-white/10 hover:bg-white/20 border border-white/10 py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
                      <Download size={16} /> Exportar
                    </button>
                  </div>

                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Desglose (Patrón / Trabajador)</h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Enf. y Mat. (Cuota Fija)', pat: results.employer.fixed, trab: 0 },
                        { label: 'Enf. y Mat. (Excedente)', pat: results.employer.excedente, trab: results.employee.excedente },
                        { label: 'Enf. y Mat. (Prest. Dinero)', pat: results.employer.dinero, trab: results.employee.dinero },
                        { label: 'Gastos Médicos Pens.', pat: results.employer.pensionados, trab: results.employee.pensionados },
                        { label: 'Invalidez y Vida', pat: results.employer.invalidez, trab: results.employee.invalidez },
                        { label: 'Riesgos de Trabajo', pat: results.employer.riesgo, trab: 0 },
                        { label: 'Guarderías', pat: results.employer.guarderia, trab: 0 },
                        { label: 'Retiro', pat: results.employer.retiro, trab: 0 },
                        { label: 'Cesantía y Vejez', pat: results.employer.cesantia, trab: results.employee.cesantia },
                        { label: 'INFONAVIT 5%', pat: results.employer.infonavit, trab: 0 },
                      ].map((item, i) => (
                        <div key={i} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0 flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-700 w-1/2 pr-2">{item.label}</span>
                          <div className="text-right flex flex-col gap-1 w-1/2">
                            <span className="text-xs font-serif font-bold text-slate-500">${item.pat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            {item.trab > 0 && (
                              <span className="text-[10px] font-serif font-bold text-legal-gold">+ ${item.trab.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            )}
                          </div>
                        </div>
                      ))}
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
