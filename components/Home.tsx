import React from 'react';
import { AppView } from '../types';
import {
  ArrowRight,
  Calculator,
  FileText,
  Landmark,
  ShieldCheck,
} from 'lucide-react';

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
  {
    view: AppView.DRAFTING,
    title: 'Documentos con IA',
    description: 'Prepara borradores laborales fundamentados.',
    action: 'Crear documento',
    icon: FileText,
  },
];

export const Home: React.FC<HomeProps> = ({ onNavigate }) => (
  <div className="min-h-full bg-[#fbfaf7] pb-24 text-slate-950">
    <header className="bg-[#070d1c] px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-sm">
      <div className="flex items-center gap-3">
        <img src="/assets/icon-mobile.png" alt="" className="h-12 w-12 rounded-xl" />
        <div className="min-w-0">
          <p className="text-[18px] font-bold text-legal-gold">Lex Laboral</p>
          <p className="text-[12px] text-slate-300">Herramientas jurídicas laborales</p>
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

      <div className="mt-6 flex items-center justify-center gap-2 text-[12px] font-semibold text-slate-500">
        <button type="button" onClick={() => onNavigate(AppView.TERMS)} className="min-h-11 rounded-lg px-3 hover:bg-slate-100">Términos</button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => onNavigate(AppView.PRIVACY)} className="min-h-11 rounded-lg px-3 hover:bg-slate-100">Privacidad</button>
      </div>
    </main>
  </div>
);
