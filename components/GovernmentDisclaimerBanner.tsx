import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';

interface GovernmentDisclaimerBannerProps {
  onOpenSources: () => void;
  className?: string;
  compact?: boolean;
}

export const GovernmentDisclaimerBanner: React.FC<GovernmentDisclaimerBannerProps> = ({
  onOpenSources,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert size={14} className="shrink-0 text-amber-700" aria-hidden="true" />
          <span className="truncate text-[11px] font-medium text-amber-900">
            No oficial · No representa al IMSS ni al Gobierno de México
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenSources}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-amber-950 underline hover:text-amber-800"
        >
          <span>Fuentes</span>
          <ExternalLink size={10} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Aviso de deslinde y no representación gubernamental"
      className={`rounded-2xl border border-amber-300/80 bg-amber-50/95 p-3.5 text-amber-950 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-amber-900">
          <ShieldAlert size={16} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
            Herramienta Privada e Independiente · No Oficial
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-900/90">
            Esta calculadora no representa ni está afiliada al IMSS, INFONAVIT ni a ninguna entidad pública. Es una estimación basada en normativas federales.
          </p>
          <button
            type="button"
            onClick={onOpenSources}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 underline hover:text-amber-800"
          >
            Ver fuentes oficiales (.gob.mx) y deslinde completo
            <ExternalLink size={11} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};
