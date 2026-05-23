
import React from 'react';
import { AppView } from '../types';
import { 
  PenTool, 
  ChevronRight, 
  Calculator, 
  ShieldCheck, 
  Home,
  BarChart3,
  Settings,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onNewCase: () => void;
  onLogout: () => void;
  user: any;
  userData?: any;
  isPremium: boolean;
  isGuest: boolean;
  notify?: (m: string, t?: any, tit?: string) => void;
  onOpenPricing?: (plan: 'draft_basic' | 'mensualidad' | 'trimestralidad') => void;
  isCEO?: boolean;
}

export const Sidebar = React.memo<SidebarProps>(({ currentView, onChangeView, onNewCase, notify, onOpenPricing, isCEO }) => {
  const navItems = [
    { id: AppView.HOME, label: 'Inicio', icon: <Home size={18} /> },
    { id: AppView.CALCULATOR, label: 'Liquidación y Finiquito', icon: <Calculator size={18} /> },
    { id: AppView.SOCIAL_SECURITY, label: 'IMSS e INFONAVIT', icon: <ShieldCheck size={18} /> },
    { id: AppView.DRAFTING, label: 'Generador Documental', icon: <PenTool size={18} /> },
  ];

  const handleNavClick = (viewId: AppView) => {
    onChangeView(viewId);
  };

  return (
    <div className="w-72 bg-legal-950 text-white flex flex-col h-full border-r border-white/5 flex-shrink-0 z-50 relative shadow-2xl no-print">
      {/* Header */}
      <div className="p-6 pb-2 space-y-6">
        <div 
          className="flex items-center space-x-3 px-2 cursor-pointer group"
          onClick={() => onChangeView(AppView.HOME)}
        >
          <div className="w-8 h-8 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden group-hover:border-legal-gold/50 transition-colors">
            <img src="/assets/logo.webp" alt="Logo" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <h1 className="font-serif font-bold text-lg tracking-tight text-white group-hover:text-legal-gold transition-colors">Lex Laboral</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="px-4 flex-1 overflow-y-auto custom-scrollbar mt-4">
        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Herramientas</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all group ${
                    currentView === item.id
                      ? 'bg-white/10 text-legal-gold border border-white/5'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={currentView === item.id ? 'text-legal-gold' : 'text-slate-500 group-hover:text-slate-300'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {currentView === item.id && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2 duration-300" />}
                </button>
              </li>
            );
          })}
        </ul>

        {/* CEO Dashboard — Only visible for admin */}
        {isCEO && (
          <>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 mt-6">Administración</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleNavClick(AppView.CEO_DASHBOARD)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all group ${
                    currentView === AppView.CEO_DASHBOARD
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
                      : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 size={18} className={currentView === AppView.CEO_DASHBOARD ? 'text-indigo-300' : ''} />
                    <span>Panel CEO</span>
                  </div>
                  {currentView === AppView.CEO_DASHBOARD && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2 duration-300" />}
                </button>
              </li>
            </ul>
          </>
        )}

        {/* User Account Settings */}
        {user && !isGuest && (
          <>
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 mt-6">Mi Cuenta</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    if (onOpenPricing) onOpenPricing('draft_basic');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all group text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500 group-hover:text-slate-300">
                      <CreditCard size={18} />
                    </span>
                    <span>Suscripción</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (notify) notify('La configuración estará disponible próximamente', 'info', 'Lex Laboral');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all group text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500 group-hover:text-slate-300">
                      <Settings size={18} />
                    </span>
                    <span>Configuración</span>
                  </div>
                </button>
              </li>
            </ul>
          </>
        )}
      </nav>

      {/* Footer Links */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-4 text-center">
            <p className="text-[11px] font-bold text-slate-300 mb-1">Acceso Registrado</p>
            <p className="text-xs text-slate-500">Calculadora laboral gratis. IMSS y generador según tu plan.</p>
        </div>

        <div className="flex items-center justify-between px-1 opacity-60">
            <button 
              onClick={() => onChangeView(AppView.PRIVACY)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Privacidad
            </button>
            <span className="text-slate-700 text-xs">•</span>
            <button 
              onClick={() => onChangeView(AppView.TERMS)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Términos
            </button>
        </div>
      </div>
    </div>
  );
});
