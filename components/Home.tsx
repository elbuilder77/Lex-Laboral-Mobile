import React from 'react';
import { AppView } from '../types';
import {
  ArrowRight,
  Calculator,
  Clock3,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import { CALCULATION_STORAGE_KEYS, formatCalculationDate, getMostRecentCalculation } from '../lib/calculation-storage';

interface HomeProps {
  onNavigate: (view: AppView) => void;
}

const tools = [
  {
    view: AppView.CALCULATOR,
    title: 'Liquidación y finiquito',
    description: 'Calcula prestaciones e indemnizaciones.',
    action: 'Calcular',
    icon: Calculator,
  },
  {
    view: AppView.SOCIAL_SECURITY,
    title: 'Cuotas IMSS e INFONAVIT',
    description: 'Estima cuotas obrero-patronales.',
    action: 'Abrir IMSS',
    icon: ShieldCheck,
  },
  {
    view: AppView.PENSION_CALCULATOR,
    title: 'Pensión IMSS',
    description: 'Proyecta tu pensión bajo Ley 73 o 97.',
    action: 'Estimar pensión',
    icon: Landmark,
  },
];

const viewByStorageKey: Record<string, AppView> = {
  [CALCULATION_STORAGE_KEYS.labor]: AppView.CALCULATOR,
  [CALCULATION_STORAGE_KEYS.socialSecurity]: AppView.SOCIAL_SECURITY,
  [CALCULATION_STORAGE_KEYS.pension]: AppView.PENSION_CALCULATOR,
};

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const recent = getMostRecentCalculation();
  const recentView = recent ? viewByStorageKey[recent.key] : undefined;

  return (
  <div className="min-h-full bg-[#fbfaf7] pb-24 text-slate-950">
    <header className="bg-[#070d1c] px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-white shadow-lg">
      <div className="flex items-center gap-4">
        <img src="/assets/icon-mobile.png" alt="Logo de Lex Laboral" className="h-16 w-16 rounded-[1.25rem] object-cover ring-2 ring-legal-gold/50 shadow-[0_12px_30px_-10px_rgba(212,175,55,0.65)]" />
        <div className="min-w-0">
          <p className="font-serif text-[24px] font-bold leading-tight text-legal-gold">Lex Laboral</p>
          <p className="mt-1 text-[12px] font-medium text-slate-300">Calculadoras jurídicas laborales</p>
        </div>
      </div>
    </header>

    <main className="mx-auto w-full max-w-lg px-5 py-6">
      <div className="mb-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-legal-gold">Inicio</p>
        <h1 className="mt-1 font-serif text-[32px] font-bold leading-tight text-[#070d1c]">¿Qué necesitas hacer?</h1>
        <p className="mt-2 text-[14px] leading-5 text-slate-600">Selecciona una herramienta para comenzar.</p>
      </div>

      <section aria-label="Herramientas" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {tools.map(({ view, title, description, action, icon: Icon }, index) => (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            className="group flex min-h-[104px] w-full items-center gap-4 border-b border-slate-200 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-slate-50 active:bg-slate-100"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#070d1c] text-legal-gold">
              <Icon size={23} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-slate-950">{title}</span>
              <span className="mt-1 block text-[13px] leading-[1.35] text-slate-600">{description}</span>
              <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-legal-gold">{action}</span>
            </span>
            <ArrowRight size={20} className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            <span className="sr-only">Herramienta {index + 1} de {tools.length}</span>
          </button>
        ))}
      </section>

      {recent && recentView && (
        <button type="button" onClick={() => onNavigate(recentView)} className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-2xl border border-legal-gold/30 bg-legal-gold/10 px-4 text-left text-slate-950">
          <Clock3 size={20} className="shrink-0 text-legal-gold" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Revisa tu último resultado</span>
            <span className="block text-[11px] text-slate-600">Guardado {formatCalculationDate(recent.savedAt)}</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
        </button>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-[12px] font-semibold text-slate-500">
        <button type="button" onClick={() => onNavigate(AppView.TERMS)} className="min-h-11 rounded-lg px-3 hover:bg-slate-100">Términos</button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => onNavigate(AppView.PRIVACY)} className="min-h-11 rounded-lg px-3 hover:bg-slate-100">Privacidad</button>
      </div>
    </main>
  </div>
  );
};
