import React from 'react';
import { CalendarClock, FileText, Pencil } from 'lucide-react';
import { formatCalculationDate } from '../lib/calculation-storage';

interface ResultContextProps {
  savedAt: string | null;
  onEdit: () => void;
}

export const ResultContext: React.FC<ResultContextProps> = ({ savedAt, onEdit }) => (
  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950" aria-label="Información del resultado">
    <div className="flex items-start gap-3">
      <CalendarClock size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">Último cálculo · {formatCalculationDate(savedAt)}</p>
        <p className="mt-1 text-[11px] leading-4">Estimación informativa con parámetros 2026. Verifica los datos y el resultado con el IMSS, tu patrón o un profesional antes de tomar decisiones.</p>
      </div>
    </div>
    <button type="button" onClick={onEdit} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-xs font-bold text-amber-950">
      <Pencil size={15} aria-hidden="true" /> Editar datos o crear un nuevo cálculo
    </button>
    <p className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-amber-800">
      <FileText size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> El PDF incluye los datos capturados, el desglose, la fecha y el aviso legal; al generarlo podrás guardarlo o compartirlo.
    </p>
  </section>
);
