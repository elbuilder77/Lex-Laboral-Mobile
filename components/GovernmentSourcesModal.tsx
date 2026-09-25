import React, { useState } from 'react';
import { X, ExternalLink, ShieldAlert, Building2 } from 'lucide-react';
import { GOVERNMENT_SOURCES, OFFICIAL_DISCLAIMER, GovernmentSource } from '../lib/legal-sources';

interface GovernmentSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryFilter?: 'labor' | 'social_security' | 'pension';
}

export const GovernmentSourcesModal: React.FC<GovernmentSourcesModalProps> = ({
  isOpen,
  onClose,
  categoryFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'filtered'>(categoryFilter ? 'filtered' : 'all');

  if (!isOpen) return null;

  const displayedSources = (activeTab === 'filtered' && categoryFilter)
    ? GOVERNMENT_SOURCES.filter(s => s.category === categoryFilter || s.category === 'general')
    : GOVERNMENT_SOURCES;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sources-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-[2rem] sm:rounded-2xl bg-[#fbfaf7] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#070d1c] px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-legal-gold/20 text-legal-gold">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 id="modal-sources-title" className="text-sm font-bold text-legal-gold">
                Fuentes Oficiales y Deslinde
              </h2>
              <p className="text-[10px] text-slate-300">
                Información normativa no oficial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95"
            aria-label="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-slate-800 text-xs">
          {/* Disclaimer Box */}
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950">
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              {OFFICIAL_DISCLAIMER.badge}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-900">
              {OFFICIAL_DISCLAIMER.full}
            </p>
          </div>

          {/* Filter options if category is provided */}
          {categoryFilter && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('filtered')}
                className={`flex-1 rounded-lg py-1.5 text-center text-[11px] font-bold transition-colors ${
                  activeTab === 'filtered'
                    ? 'bg-[#070d1c] text-legal-gold'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Fuentes de esta herramienta
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 rounded-lg py-1.5 text-center text-[11px] font-bold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#070d1c] text-legal-gold'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Todas las fuentes (.gob.mx)
              </button>
            </div>
          )}

          {/* Sources list */}
          <div className="space-y-2.5">
            <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Enlaces a portales y leyes gubernamentales:
            </p>
            {displayedSources.map((source: GovernmentSource) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-legal-gold hover:bg-legal-gold/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-[12px] group-hover:text-legal-gold">
                    {source.name}
                  </span>
                  <ExternalLink size={13} className="shrink-0 text-slate-400 group-hover:text-legal-gold" />
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                  <Building2 size={11} />
                  <span className="truncate">{source.institution}</span>
                </div>
                <span className="mt-1.5 font-mono text-[10px] text-slate-500 underline truncate">
                  {source.url}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 items-center justify-center rounded-xl bg-[#070d1c] px-5 text-xs font-bold text-legal-gold hover:bg-slate-900 active:scale-95"
          >
            Entendido y cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
