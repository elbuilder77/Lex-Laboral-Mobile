import React from 'react';
import { motion } from 'framer-motion';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight, ShieldCheck, LogIn, LogOut, ArrowUpRight } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getPathForView } from '../lib/routes';
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
    title: 'Liquidación y Finiquito',
    summary: 'Calculadora completa de indemnizaciones constitucionales, primas de antigüedad y finiquitos de ley.',
    access: 'Acceso Gratuito con Registro',
    action: 'Calcular Prestaciones',
    accent: 'text-legal-gold',
    badgeStyle: 'border-white/10 bg-white/5 text-slate-300',
    icon: <Calculator size={20} className="text-legal-gold" />,
  },
  {
    view: AppView.DRAFTING,
    title: 'Generador de Documentos',
    summary: 'Proyecta contratos, actas, convenios y demandas asistidos por IA con búsqueda semántica en la LFT e IMSS.',
    access: 'Por Documento o Plan',
    action: 'Generar Borrador',
    accent: 'text-legal-gold',
    badgeStyle: 'border-legal-gold/20 bg-legal-gold/5 text-legal-gold',
    icon: <FileText size={20} className="text-legal-gold" />,
  },
  {
    view: AppView.SOCIAL_SECURITY,
    title: 'Calculadora IMSS e INFONAVIT',
    summary: 'Proyección detallada de cuotas obrero-patronales, ramos de seguro social y prima de riesgo de trabajo.',
    access: 'Plan Premium Activo',
    action: 'Calcular IMSS',
    accent: 'text-legal-gold',
    badgeStyle: 'border-white/10 bg-white/5 text-slate-300',
    icon: <ShieldCheck size={20} className="text-legal-gold" />,
  },
];

const supportBlocks = [
  {
    title: '1. Análisis y Recuperación (RAG)',
    body: 'A diferencia de una IA genérica que puede inventar información, nuestro motor lee la LFT y LSS en milisegundos para extraer solo los artículos aplicables a tu caso.',
  },
  {
    title: '2. Restricción Legal Estricta',
    body: 'Nuestra tecnología ancla a la Inteligencia Artificial a la ley. Se le prohíbe usar conocimientos externos o alucinar legislaciones inexistentes.',
  },
  {
    title: '3. Redacción Fundamentada',
    body: 'La Inteligencia Artificial utiliza exclusivamente los artículos extraídos para redactar tu documento. Obtienes borradores personalizados con precisión legal absoluta.',
  },
];

export const Home: React.FC<HomeProps> = ({ onNavigate, user, onLogin, onLogout }) => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, view: AppView) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <div className="animate-fade-in font-sans bg-[#070b14] text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.15),_transparent_55%),linear-gradient(180deg,_#0b0f19_0%,_#070b14_100%)] py-12 md:py-20">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-legal-gold/5 blur-[120px]" />
        <div className="absolute -bottom-10 left-10 h-80 w-80 rounded-full bg-slate-900/30 blur-[100px]" />

        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center md:px-10">
          
          {/* Left Column: Heading and Brand */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col space-y-8"
          >
            <div className="space-y-6">
              {/* Premium Large Transparent Logo replacing text headings and subtitles */}
              <div className="max-w-[440px] select-none animate-in fade-in duration-700">
                <img 
                  src="/assets/logo.webp" 
                  alt="Lex Laboral" 
                  className="w-full h-auto object-contain drop-shadow-[0_15px_35px_rgba(212,175,55,0.15)]" 
                  loading="eager"
                />
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 font-medium">
                Automatización legal con tecnología RAG. Genera documentos personalizados con fundamentación legal exacta.
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-legal-gold/20 bg-legal-gold/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-legal-gold">
                Liquidaciones y Finiquitos
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 shadow-sm">
                Seguridad Social IMSS
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 shadow-sm">
                Régimen Vigente 2026
              </span>
            </div>

            {/* Actions & Login Status */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <div className="inline-flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 px-4.5 py-2.5 shadow-sm backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-legal-gold to-yellow-600 text-[11px] font-bold text-slate-950 border border-white/10 shadow-inner">
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="max-w-[180px] truncate text-xs font-semibold text-slate-200">{user.email}</span>
                  <div className="h-4 w-px bg-white/10" />
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-red-400"
                    title="Cerrar sesión"
                  >
                    <LogOut size={12} />
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-legal-gold px-6.5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-[0_20px_45px_-12px_rgba(212,175,55,0.35)] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_45px_-12px_rgba(255,255,255,0.15)] active:translate-y-0"
                >
                  <LogIn size={15} className="text-slate-950 transition-transform group-hover:translate-x-0.5" />
                  <span>Iniciar sesión</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Right Column: Interactive Dashboard Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
          >
            <WorkspacePanel className="relative overflow-hidden p-6 sm:p-7 border border-white/5 bg-slate-950/40 backdrop-blur-md rounded-[2rem] shadow-[0_30px_70px_-40px_rgba(0,0,0,0.7)]">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-legal-gold/5 to-transparent pointer-events-none" />

              {/* Tools Cards */}
              <div className="relative space-y-3.5">
                {tools.map((tool, index) => (
                  <a
                    key={tool.view}
                    href={getPathForView(tool.view)}
                    onClick={(event) => handleNavClick(event, tool.view)}
                    className="group flex items-start gap-4.5 rounded-2xl border border-white/5 bg-slate-900/60 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-legal-gold/40 hover:bg-slate-900/80"
                  >
                    {/* Dark Icon Chip Homogeneous with LexCorporativo */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-slate-950 shadow-md group-hover:border-legal-gold/40 transition-colors duration-300">
                      {tool.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-legal-gold tracking-widest font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${tool.badgeStyle}`}>
                          {tool.access}
                        </span>
                      </div>
                      <h2 className="mt-2 text-md font-bold text-white transition-colors group-hover:text-legal-gold">{tool.title}</h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 font-medium">{tool.summary}</p>
                      
                      {/* Premium Information Hierarchy CTA Button */}
                      <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-300 group-hover:bg-legal-gold group-hover:text-slate-950 group-hover:border-legal-gold group-hover:-translate-y-0.5">
                        <span>{tool.action}</span>
                        <ChevronRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-500 group-hover:bg-legal-gold/10 group-hover:text-legal-gold transition-colors duration-300">
                      <ArrowUpRight size={14} />
                    </div>
                  </a>
                ))}
              </div>
            </WorkspacePanel>
          </motion.div>

        </div>
      </section>

      {/* Support Blocks Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {supportBlocks.map((block) => (
            <WorkspacePanel key={block.title} className="p-6.5 border border-white/5 bg-slate-900/40 shadow-sm rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-legal-gold to-slate-900 opacity-80" />
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-legal-gold">Proceso RAG Lex</span>
              <h2 className="mt-2 text-md font-bold text-white">{block.title}</h2>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-400 font-medium">{block.body}</p>
            </WorkspacePanel>
          ))}
        </div>
      </section>

      {/* Elegant Homogeneous Footer */}
      <footer className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-white/5 px-6 py-10 text-center md:flex-row md:px-10 md:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-legal-gold/20 bg-slate-950 p-1">
            <img src="/assets/logo.webp" alt="Logo" className="h-full w-full object-cover rounded-md" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Lex Laboral © 2026</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          <a href={getPathForView(AppView.TERMS)} onClick={(event) => handleNavClick(event, AppView.TERMS)} className="transition-colors hover:text-white">
            Términos
          </a>
          <a href={getPathForView(AppView.PRIVACY)} onClick={(event) => handleNavClick(event, AppView.PRIVACY)} className="transition-colors hover:text-white">
            Privacidad
          </a>
          <a href="mailto:admin@lexlaboral.com.mx" className="transition-colors hover:text-white">
            Soporte
          </a>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          Desarrollado por <span className="font-bold text-slate-300">filex dev</span>
        </p>
      </footer>
    </div>
  );
};
