import React from 'react';
import { motion } from 'framer-motion';
import { AppView } from '../types';
import { Calculator, FileText, ChevronRight, ShieldCheck, LogIn, LogOut, ArrowUpRight, Scale } from 'lucide-react';
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
    title: 'Liquidación y Finiquito',
    summary: 'Calculadora completa de indemnizaciones constitucionales, primas de antigüedad y finiquitos de ley.',
    access: 'Acceso Gratuito con Registro',
    action: 'Calcular Prestaciones',
    accent: 'text-legal-gold',
    badgeStyle: 'border-slate-200/80 bg-slate-50 text-slate-600',
    icon: <Calculator size={20} className="text-legal-gold" />,
  },
  {
    view: AppView.DRAFTING,
    title: 'Generador de Documentos RAG',
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
    badgeStyle: 'border-slate-200/80 bg-slate-50 text-slate-600',
    icon: <ShieldCheck size={20} className="text-legal-gold" />,
  },
];

const supportBlocks = [
  {
    title: 'Cálculo Exacto',
    body: 'Parámetros y tasas de cálculo actualizados para el año 2026 (Salario Mínimo y UMA).',
  },
  {
    title: 'Contexto RAG Semántico',
    body: 'La IA busca y fundamenta automáticamente cada borrador documental en la LFT e IMSS.',
  },
  {
    title: 'Estilo Homogéneo',
    body: 'Diseñado bajo la misma línea de alta gama y elegancia jurídica que LexCorporativo.',
  },
];

export const Home: React.FC<HomeProps> = ({ onNavigate, user, onLogin, onLogout }) => {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, view: AppView) => {
    event.preventDefault();
    onNavigate(view);
  };

  return (
    <div className="animate-fade-in font-sans bg-[#FAFBFD]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.12),_transparent_45%),linear-gradient(180deg,_#FDFDFC_0%,_#F8FAFC_60%,_#F1F5F9_100%)] py-12 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-legal-gold/45 to-transparent" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-legal-gold/5 blur-[100px]" />
        <div className="absolute -bottom-10 left-10 h-80 w-80 rounded-full bg-slate-200/40 blur-[80px]" />

        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center md:px-10">
          
          {/* Left Column: Heading and Brand */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-legal-gold/30 bg-slate-950 p-[3px] shadow-[0_15px_35px_-12px_rgba(15,23,42,0.65)]">
                <img src="/assets/logo.webp" alt="Lex Laboral Logo" className="h-full w-full object-cover rounded-[10px]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-legal-gold">Lex Laboral</span>
                <h2 className="text-xs text-slate-500 font-medium">Plataforma Profesional de Inteligencia Laboral</h2>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
                Cálculos laborales y <br />
                <span className="bg-gradient-to-r from-slate-950 via-legal-gold to-slate-900 bg-clip-text text-transparent">
                  documentos asistidos por IA.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 font-medium">
                La suite inteligente para el derecho del trabajo en México. Realiza cálculos exactos de liquidaciones, cuotas IMSS y proyecta escritos con fundamentación semántica (RAG).
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-legal-gold/20 bg-legal-gold/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-legal-gold">
                Liquidaciones y Finiquitos
              </span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                Seguridad Social IMSS
              </span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                Régimen Vigente 2026
              </span>
            </div>

            {/* Actions & Login Status */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <div className="inline-flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white/80 px-4.5 py-2.5 shadow-sm backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-slate-800 text-[11px] font-bold text-legal-gold border border-legal-gold/25 shadow-inner">
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="max-w-[180px] truncate text-xs font-semibold text-slate-700">{user.email}</span>
                  <div className="h-4 w-px bg-slate-200" />
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-red-500"
                    title="Cerrar sesión"
                  >
                    <LogOut size={12} />
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-slate-950 px-6.5 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_20px_40px_-16px_rgba(15,23,42,0.85)] border border-white/5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-12px_rgba(212,175,55,0.25)] hover:border-legal-gold/30 active:translate-y-0"
                >
                  <LogIn size={15} className="text-legal-gold transition-transform group-hover:translate-x-0.5" />
                  <span>Iniciar sesión</span>
                </button>
              )}

              <button
                onClick={(event) => handleNavClick(event, AppView.CALCULATOR)}
                className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-950 transition-colors"
              >
                <span>Calculadora Laboral</span>
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>

          {/* Right Column: Interactive Dashboard Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
          >
            <WorkspacePanel className="relative overflow-hidden p-6 sm:p-7 border border-slate-200/80 bg-white/60 backdrop-blur-md rounded-[2rem] shadow-[0_30px_70px_-40px_rgba(15,23,42,0.15)]">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-legal-gold/5 to-transparent pointer-events-none" />
              
              {/* Box Info */}
              <div className="relative rounded-2xl border border-slate-200/80 bg-slate-950 px-5.5 py-4.5 text-white shadow-xl">
                <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-legal-gold/80">Espacio de Trabajo</span>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  Selecciona uno de los módulos de Lex Laboral a continuación para comenzar tu consulta o redacción semántica RAG.
                </p>
              </div>

              {/* Tools Cards */}
              <div className="relative mt-5 space-y-3.5">
                {tools.map((tool, index) => (
                  <a
                    key={tool.view}
                    href={getPathForView(tool.view)}
                    onClick={(event) => handleNavClick(event, tool.view)}
                    className="group flex items-start gap-4.5 rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-legal-gold/55 hover:bg-white hover:shadow-[0_20px_45px_-24px_rgba(212,175,55,0.18)]"
                  >
                    {/* Dark Icon Chip Homogeneous with LexCorporativo */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-slate-800 bg-slate-950 shadow-md group-hover:border-legal-gold/50 transition-colors duration-300">
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
                      <h2 className="mt-2 text-md font-bold text-slate-950 transition-colors group-hover:text-legal-gold">{tool.title}</h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-medium">{tool.summary}</p>
                    </div>

                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-legal-gold/10 group-hover:text-legal-gold transition-colors duration-300">
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
            <WorkspacePanel key={block.title} className="p-6.5 border border-slate-200/50 bg-white/70 shadow-sm rounded-2xl relative overflow-hidden group hover:border-slate-300 transition-colors">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-legal-gold to-slate-900 opacity-80" />
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">Garantías Lex</span>
              <h2 className="mt-2 text-md font-bold text-slate-950">{block.title}</h2>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-500 font-medium">{block.body}</p>
            </WorkspacePanel>
          ))}
        </div>

        {/* SEO Structured Content */}
        <div className="mt-12">
          <SEOContentSection
            title="Herramientas jurídicas laborales para México"
            intro="Lex Laboral es un sistema de soporte profesional diseñado para simplificar cálculos indemnizatorios complejos y estructurar borradores jurídicos en materia del Derecho del Trabajo en México. Cada herramienta ha sido programada con referencias técnicas de la LFT y la Ley del Seguro Social vigentes para 2026."
            highlights={[
              {
                title: 'Calculadora de prestaciones',
                body: 'Permite desglosar de forma detallada conceptos como indemnización de 3 meses, 20 días por año de servicio, aguinaldos y vacaciones proporcionales.',
              },
              {
                title: 'Cálculo de cuotas de IMSS',
                body: 'Desglose claro por ramo de aseguramiento del régimen obligatorio y prima de riesgo patronal conforme a la Ley del Seguro Social.',
              },
              {
                title: 'Generación semántica asistida',
                body: 'Escribe borradores formales de contratos y actas administrativas de forma rápida, enriquecidos semánticamente por artículos reales de la ley.',
              },
            ]}
            faqs={[
              {
                question: '¿Qué es el motor RAG en Lex Laboral?',
                answer: 'RAG (Retrieval-Augmented Generation) es un sistema inteligente que vectoriza tu solicitud, busca automáticamente los artículos más relevantes de la Ley Federal del Trabajo y del Seguro Social en Supabase, e inyecta esa fundamentación en la inteligencia de redacción para lograr borradores de extrema precisión.',
              },
              {
                question: '¿Es compatible y seguro en producción?',
                answer: 'Sí. Todas las llamadas se realizan mediante endpoints cifrados y cuentan con rigurosos controles de seguridad, CORS y verificación del origen, alineados con el estándar de LexCorporativo.',
              },
            ]}
          />
        </div>
      </section>

      {/* Elegant Homogeneous Footer */}
      <footer className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-slate-200/60 px-6 py-10 text-center md:flex-row md:px-10 md:text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-legal-gold/20 bg-slate-950 p-1">
            <img src="/assets/logo.webp" alt="Logo" className="h-full w-full object-cover rounded-md" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Lex Laboral © 2026</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
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

        <p className="text-[11px] text-slate-500 font-medium">
          Desarrollado por <span className="font-bold text-slate-950">filex dev</span>
        </p>
      </footer>
    </div>
  );
};
