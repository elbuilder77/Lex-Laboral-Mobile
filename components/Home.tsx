import React from 'react';
import { motion } from 'framer-motion';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getPathForView } from '../lib/routes';
import { SEOContentSection } from './SEOContentSection';
import { WorkspacePanel } from './ui/Workspace';

interface HomeProps {
  onNavigate: (view: AppView) => void;
  user?: SupabaseUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

const tools = [
  {
    view: AppView.CALCULATOR,
    title: 'Liquidación y finiquito',
    summary: 'Calcula finiquito, indemnización y prima de antigüedad con desglose claro.',
    accent: 'text-blue-600',
    surface: 'bg-blue-50 text-blue-600',
    access: 'Gratis con registro',
    action: 'Abrir calculadora',
    icon: <Calculator size={24} />,
  },
  {
    view: AppView.DRAFTING,
    title: 'Generador documental',
    summary: 'Complementa el caso con contratos, convenios y escritos de trabajo.',
    accent: 'text-amber-600',
    surface: 'bg-amber-50 text-amber-600',
    access: 'Documento suelto o plan',
    action: 'Abrir generador',
    icon: <FileText size={24} />,
  },
  {
    view: AppView.SOCIAL_SECURITY,
    title: 'IMSS e INFONAVIT',
    summary: 'Proyecta cuotas y reparto patrón-trabajador con vista mensual.',
    accent: 'text-emerald-600',
    surface: 'bg-emerald-50 text-emerald-600',
    access: 'Plan activo',
    action: 'Abrir IMSS',
    icon: <ShieldCheck size={24} />,
  },
];

const supportBlocks = [
  {
    title: 'Gancho inmediato',
    body: 'Las calculadoras abren primero y entregan valor desde la primera interacción.',
  },
  {
    title: 'Vigencia visible',
    body: 'Los parámetros clave se muestran con referencia operativa 2026.',
  },
  {
    title: 'Documento como apoyo',
    body: 'El generador entra después del cálculo, no como punto de entrada del producto.',
  },
];

export const Home: React.FC<HomeProps> = ({ onNavigate, user, onLogin, onLogout }) => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, view: AppView) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_26%),linear-gradient(180deg,_#fdfdfc_0%,_#f7fafc_52%,_#f4f7fb_100%)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-legal-gold/70 to-transparent" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-legal-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-slate-200/70 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:px-10 md:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex flex-col justify-between"
          >
            <div>
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-[1.8rem] border border-white/60 bg-slate-950 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.8)]">
                  <img src="/assets/logo.webp" alt="Lex Laboral Logo" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Lex Laboral</p>
                  <p className="mt-2 text-sm text-slate-500">Liquidación, IMSS y documentos laborales</p>
                </div>
              </div>

              <h1 className="max-w-3xl font-serif text-5xl font-bold leading-[0.95] tracking-tight text-slate-950 md:text-6xl">
                Liquidación, finiquito e IMSS para México.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                Calcula prestaciones y cuotas en minutos. Después, si hace falta, genera el documento.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Liquidación y finiquito
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  IMSS e INFONAVIT
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Vigencia 2026
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {user ? (
                <div className="inline-flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white/90 px-5 py-3 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-legal-gold to-amber-500 text-xs font-bold text-white">
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="max-w-[220px] truncate text-sm font-medium text-slate-700">{user.email}</span>
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-red-500"
                    title="Cerrar sesión"
                  >
                    <LogOut size={14} />
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="group inline-flex items-center gap-3 rounded-[1.4rem] bg-slate-950 px-7 py-4 text-sm font-bold text-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.85)] transition-all hover:-translate-y-0.5 hover:bg-slate-900"
                >
                  <LogIn size={18} className="transition-transform group-hover:translate-x-0.5" />
                  Iniciar sesión
                </button>
              )}

              <a
                href={getPathForView(AppView.CALCULATOR)}
                onClick={(event) => handleNavClick(event, AppView.CALCULATOR)}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-slate-950"
              >
                Abrir calculadora
                <ChevronRight size={16} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          >
            <WorkspacePanel className="relative overflow-hidden p-4 sm:p-5">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-legal-gold/8 to-transparent" />
              <div className="relative rounded-[1.75rem] border border-slate-200/80 bg-slate-950 px-5 py-4 text-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.9)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Flujos principales</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                  Cada módulo entra con un objetivo claro, una superficie principal y el acceso visible desde el primer vistazo.
                </p>
              </div>

              <div className="relative mt-4 space-y-3">
                {tools.map((tool, index) => (
                  <a
                    key={tool.view}
                    href={getPathForView(tool.view)}
                    onClick={(event) => handleNavClick(event, tool.view)}
                    className="group flex items-start gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-5 py-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] ${tool.surface}`}>
                      {tool.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          {tool.access}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-slate-950">{tool.title}</h2>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{tool.summary}</p>
                    </div>
                    <div className={`mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${tool.accent}`}>
                      <span className="hidden sm:inline">{tool.action}</span>
                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </a>
                ))}
              </div>
            </WorkspacePanel>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {supportBlocks.map((block) => (
            <WorkspacePanel key={block.title} className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Sistema</p>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{block.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{block.body}</p>
            </WorkspacePanel>
          ))}
        </div>

        <div className="mt-12">
          <SEOContentSection
            title="Herramientas jurídicas laborales para México"
            intro="Lex Laboral está orientado a búsquedas prácticas de usuarios que necesitan calcular liquidación, finiquito o cuotas IMSS, así como preparar un borrador documental laboral. La plataforma reúne una calculadora laboral gratuita para usuarios registrados, una calculadora IMSS para planes activos y un generador documental con acceso por plan o por documento suelto."
            highlights={[
              {
                title: 'Calculadora laboral',
                body: 'Pensada para consultas frecuentes como liquidación por despido injustificado, finiquito, prima de antigüedad, vacaciones y aguinaldo proporcional.',
              },
              {
                title: 'Calculadora IMSS',
                body: 'Enfocada en cuotas obrero-patronales, desglose por ramo de seguro y apoyo para revisar prima de riesgo e INFONAVIT.',
              },
              {
                title: 'Generador documental',
                body: 'Útil para construir borradores de documentos laborales frecuentes y partir de una base ordenada antes de la revisión jurídica final.',
              },
            ]}
            faqs={[
              {
                question: 'Lex Laboral sirve para calcular liquidacion y finiquito en Mexico?',
                answer: 'Sí. La plataforma incluye una calculadora de prestaciones laborales enfocada en escenarios frecuentes conforme a la normativa mexicana.',
              },
              {
                question: 'Que parte de la app es gratis?',
                answer: 'La calculadora laboral es gratuita para usuarios registrados. La calculadora IMSS y el generador de documentos dependen del plan activo o del documento suelto.',
              },
              {
                question: 'La plataforma esta dirigida a trabajadores o a abogados?',
                answer: 'A ambos. Puede ser útil para trabajadores que quieren una estimación inicial y para despachos o áreas de recursos humanos que necesitan una referencia operativa rápida.',
              },
            ]}
          />
        </div>
      </section>

      <footer className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-slate-200/80 px-6 py-8 text-center md:flex-row md:px-10 md:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-slate-950">
            <img src="/assets/logo.webp" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Lex Laboral © 2026</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <a href={getPathForView(AppView.TERMS)} onClick={(event) => handleNavClick(event, AppView.TERMS)} className="transition-colors hover:text-slate-900">
            Términos
          </a>
          <a href={getPathForView(AppView.PRIVACY)} onClick={(event) => handleNavClick(event, AppView.PRIVACY)} className="transition-colors hover:text-slate-900">
            Privacidad
          </a>
          <a href="mailto:admin@lexlaboral.com.mx" className="transition-colors hover:text-slate-900">
            Soporte
          </a>
        </div>

        <p className="text-xs text-slate-500">
          Desarrollado por <span className="font-bold text-slate-900">filex dev</span> en Mérida, Yucatán
        </p>
      </footer>
    </div>
  );
};
