
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Heart, 
  Baby, 
  Home, 
  TrendingUp, 
  Download, 
  AlertCircle,
  Stethoscope,
  Settings2,
  Users,
  Zap
} from 'lucide-react';
import { NotificationType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { checkCalculatorUsage } from '../services/gemini';
import { SEOContentSection } from './SEOContentSection';
import { MEXICO_LABOR_DEFAULTS_2026 } from '../lib/legal-constants';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel, WorkspaceStat } from './ui/Workspace';

export const SocialSecurityCalculator: React.FC<{
  notify: (m: string, t?: NotificationType) => void;
  onRequireLogin?: () => void;
  onRequirePremium?: () => void;
}> = ({ notify, onRequireLogin, onRequirePremium }) => {
  const { user, session, access } = useAuth();
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

  const calculate = async () => {
    if (!user) {
      if (onRequireLogin) onRequireLogin();
      notify("Regístrate para continuar", "info");
      return;
    }
    
    if (!access.hasActiveSubscription) {
      if (onRequirePremium) onRequirePremium();
      notify("Función Exclusiva LexPremium", "warning");
      return;
    }

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

    try {
      await checkCalculatorUsage(session?.access_token || '');
    } catch (error: any) {
      notify(error?.message || "No se pudo validar el acceso a IMSS.", "error");
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
      if (ratio <= 1.50) cesantiaRate = 0.03567;
      else if (ratio <= 2.00) cesantiaRate = 0.04230;
      else if (ratio <= 2.50) cesantiaRate = 0.04894;
      else if (ratio <= 3.00) cesantiaRate = 0.05558;
      else if (ratio <= 3.50) cesantiaRate = 0.06221;
      else if (ratio <= 4.00) cesantiaRate = 0.06885;
      else cesantiaRate = 0.08241; 
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

    setResults({
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
    });

    notify("Cálculo finalizado", "success");
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
    const content = `CUOTAS IMSS/INFONAVIT - LEXLABORAL\nSBC: $${sbc.toFixed(2)}\nPatrón: $${results.employer.total.toFixed(2)}\nTrabajador: $${results.employee.total.toFixed(2)}\nTotal: $${results.total.toFixed(2)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cuotas_IMSS.txt`;
    link.click();
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Calculadora IMSS"
        title="IMSS e INFONAVIT"
        description="Proyecta cuotas y reparto patrón-trabajador con vigencia 2026."
        icon={<ShieldCheck size={28} />}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-8">
            <WorkspacePanel className="space-y-8 p-8">
              <div>
                <h3 className="text-sm font-bold text-slate-950">Datos de cotización</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Proyección rápida</p>
              </div>
              {!access.hasActiveSubscription ? (
                <div className="ui-subtle-block p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Acceso</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    Esta calculadora forma parte del plan mensual o trimestral.
                  </p>
                  <button
                    onClick={() => onRequirePremium?.()}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-legal-gold transition-all hover:bg-slate-900"
                  >
                    Ver planes
                  </button>
                </div>
              ) : null}
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="ui-label">Salario Base de Cotización (SBC)</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                    <input type="number" value={sbc || ''} onChange={(e) => setSbc(Number(e.target.value))} className="ui-input w-full pl-10 pr-4 text-lg font-bold" placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="ui-label px-0">Clase de riesgo</label>
                    <button onClick={() => setShowRiskCalc(!showRiskCalc)} className="text-xs font-bold text-legal-gold hover:underline">Variable</button>
                  </div>
                  <select value={riskClass} onChange={(e) => setRiskClass(Number(e.target.value))} className="ui-input">
                    <option value={0}>Seleccione clase...</option>
                    <option value={0.54355}>Clase I (0.54355%)</option>
                    <option value={1.13065}>Clase II (1.13065%)</option>
                    <option value={2.59840}>Clase III (2.59840%)</option>
                    <option value={4.65325}>Clase IV (4.65325%)</option>
                    <option value={7.58875}>Clase V (7.58875%)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="ui-label">Días</label>
                  <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} className="ui-input" />
                </div>

                <button onClick={() => setShowAdvanced(!showAdvanced)} className="ui-subtle-block flex w-full items-center justify-between p-4 text-slate-500 transition-all hover:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <Settings2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Constantes 2026</span>
                  </div>
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ui-subtle-block space-y-4 overflow-hidden p-6">
                      <div className="space-y-2">
                        <label className="ui-label">Salario mínimo vigente</label>
                        <input type="number" value={minWage} onChange={(e) => setMinWage(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <label className="ui-label">UMA vigente</label>
                        <input type="number" value={umaValue} onChange={(e) => setUmaValue(Number(e.target.value))} className="ui-input px-4 py-3 text-xs" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={calculate} className="w-full py-5 bg-gradient-to-r from-legal-950 to-slate-900 text-legal-gold rounded-[1.5rem] font-bold shadow-2xl shadow-legal-950/20 hover:shadow-legal-950/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden">
                  <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp size={20} className="group-hover:translate-x-1 transition-transform" />
                  <span className="tracking-wide">Calcular cuotas</span>
                </button>
              </div>
            </WorkspacePanel>
          </div>

          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!results ? (
                <WorkspaceEmpty
                  icon={<Activity size={42} />}
                  title="Tu proyección aparecerá aquí"
                  description="Captura SBC, riesgo y días para ver cuotas patronales y obreras."
                />
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <WorkspaceStat label="Patrón" value={`$${results.employer.total.toLocaleString()}`} />
                    <WorkspaceStat label="Trabajador" value={`$${results.employee.total.toLocaleString()}`} emphasis="accent" />
                    <WorkspaceStat label="Total" value={`$${results.total.toLocaleString()}`} emphasis="inverse" />
                  </div>

                  <WorkspacePanel className="overflow-hidden rounded-[2.4rem]">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-900">Desglose de cuotas</h4>
                      <button onClick={handleExport} className="p-2 text-slate-400 hover:text-legal-950 transition-colors"><Download size={20} /></button>
                    </div>
                    <div className="p-0">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Concepto</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Patrón</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Trabajador</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[
                            { label: 'Enf. y Mat. (Cuota Fija)', pat: results.employer.fixed, trab: 0 },
                            { label: 'Enf. y Mat. (Excedente 3 UMA)', pat: results.employer.excedente, trab: results.employee.excedente },
                            { label: 'Enf. y Mat. (Prest. en Dinero)', pat: results.employer.dinero, trab: results.employee.dinero },
                            { label: 'Enf. y Mat. (Gastos Méd. Pens.)', pat: results.employer.pensionados, trab: results.employee.pensionados },
                            { label: 'Invalidez y Vida', pat: results.employer.invalidez, trab: results.employee.invalidez },
                            { label: 'Riesgos de Trabajo', pat: results.employer.riesgo, trab: 0 },
                            { label: 'Guarderías y Prest. Sociales', pat: results.employer.guarderia, trab: 0 },
                            { label: 'Retiro', pat: results.employer.retiro, trab: 0 },
                            { label: 'Cesantía en Edad Avanzada y Vejez', pat: results.employer.cesantia, trab: results.employee.cesantia },
                            { label: 'INFONAVIT 5%', pat: results.employer.infonavit, trab: 0 },
                          ].map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-6 text-sm font-medium text-slate-700">{row.label}</td>
                              <td className="p-6 text-right font-serif font-bold text-slate-500">${row.pat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="p-6 text-right font-serif font-bold text-slate-500">${row.trab.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="p-6 text-right font-serif font-bold text-slate-900">${(row.pat + row.trab).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </WorkspacePanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      

      <SEOContentSection
        title="Calculadora de cuotas IMSS e INFONAVIT"
        intro="La calculadora IMSS permite estimar cuotas obrero-patronales con desglose por ramo de aseguramiento y aporta una base útil para revisión patronal, auditoría interna y validación preliminar de costos de nómina. También incluye apoyo para proyectar la prima de riesgo de trabajo."
        highlights={[
          {
            title: 'Cuotas obrero-patronales',
            body: 'Desglosa enfermedad y maternidad, invalidez y vida, retiro, cesantía, guarderías, prestaciones sociales e INFONAVIT.',
          },
          {
            title: 'Prima de riesgo',
            body: 'Permite trabajar con clase de riesgo fija o variable para estimar escenarios de cotización y revisar impactos mensuales.',
          },
          {
            title: 'Acceso del producto',
            body: 'Esta herramienta forma parte del acceso para usuarios registrados con plan mensual o trimestral activo dentro de Lex Laboral.',
          },
        ]}
        faqs={[
          {
            question: 'Que calcula esta calculadora IMSS?',
            answer: 'Calcula las cuotas del patrón y del trabajador a partir del salario base de cotización, la UMA, la clase de riesgo, los días cotizados y otros parámetros de seguridad social.',
          },
          {
            question: 'La calculadora IMSS es gratis?',
            answer: 'No. Está disponible para usuarios registrados con plan mensual o trimestral activo.',
          },
          {
            question: 'Sirve como determinacion definitiva ante el IMSS?',
            answer: 'No. Es una herramienta de apoyo técnico para estimación y revisión. La determinación final depende de la integración salarial, movimientos afiliatorios y circunstancias concretas del patrón.',
          },
        ]}
      />
    </WorkspacePage>
  );
};
