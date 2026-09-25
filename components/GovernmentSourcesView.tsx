import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldAlert, BookOpen, Building2, Landmark, CheckCircle2 } from 'lucide-react';
import { GOVERNMENT_SOURCES, OFFICIAL_DISCLAIMER, GovernmentSource } from '../lib/legal-sources';

interface GovernmentSourcesViewProps {
  onBack: () => void;
}

export const GovernmentSourcesView: React.FC<GovernmentSourcesViewProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas las fuentes' },
    { id: 'labor', label: 'Laboral (LFT)' },
    { id: 'social_security', label: 'IMSS e INFONAVIT' },
    { id: 'pension', label: 'Pensiones' },
    { id: 'general', label: 'Salarios y UMA' },
  ];

  const filteredSources = selectedCategory === 'all'
    ? GOVERNMENT_SOURCES
    : GOVERNMENT_SOURCES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-full bg-[#fbfaf7] pb-24 text-slate-950">
      {/* Header */}
      <header className="bg-[#070d1c] px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-serif text-[20px] font-bold leading-tight text-legal-gold">
              Fuentes Oficiales y Deslinde
            </h1>
            <p className="text-[11px] text-slate-300">
              Transparencia normativa y no representación gubernamental
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-5 py-6 space-y-6">
        {/* Prominent Government Non-Affiliation Disclaimer */}
        <section
          aria-label="Aviso de No Afiliación Gubernamental"
          className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
              <ShieldAlert size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
                Aviso Legal Importante
              </span>
              <h2 className="mt-1.5 text-[16px] font-bold text-amber-950">
                {OFFICIAL_DISCLAIMER.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-amber-900">
                {OFFICIAL_DISCLAIMER.full}
              </p>
            </div>
          </div>
        </section>

        {/* Why this app uses public sources */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#070d1c]">
            <BookOpen size={20} className="text-legal-gold" />
            <h3 className="text-[15px] font-bold">Base Normativa Pública</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-600">
            Los algoritmos de cálculo de <strong>Lex Laboral</strong> aplican estrictamente los textos vigentes de las leyes federales de los Estados Unidos Mexicanos publicados en el Diario Oficial de la Federación (DOF) y en los portales oficiales de la H. Cámara de Diputados, IMSS, INFONAVIT, CONSAR y CONASAMI.
          </p>
          <p className="text-[13px] leading-relaxed text-slate-600">
            A continuación se proporciona acceso directo a cada una de las fuentes oficiales originales (.gob.mx) para su consulta pública:
          </p>
        </section>

        {/* Categories filter */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar fuentes oficiales">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#070d1c] text-legal-gold shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sources list */}
        <section aria-label="Lista de fuentes oficiales gubernamentales" className="space-y-3">
          {filteredSources.map((source: GovernmentSource) => (
            <article
              key={source.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Building2 size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{source.institution}</span>
                  </div>
                  <h4 className="mt-1 text-[15px] font-bold text-slate-900 leading-snug">
                    {source.name}
                  </h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
                    {source.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[12px] font-bold text-[#070d1c] transition-colors hover:border-legal-gold hover:bg-legal-gold/10"
                >
                  <span className="truncate pr-2 font-mono text-[11px] text-slate-700 group-hover:text-[#070d1c]">
                    {source.url}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-legal-gold font-sans font-bold">
                    <span>Abrir fuente</span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </span>
                </a>
              </div>
            </article>
          ))}
        </section>

        {/* Guidance on official procedures */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#070d1c]">
            <Landmark size={20} className="text-legal-gold" />
            <h3 className="text-[15px] font-bold">Trámites y Consultas Oficiales</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-600">
            Si requiere tramitar formalmente una pensión, aclaración de cuotas, denuncia laboral o solicitud de crédito, debe acudir directamente ante las dependencias competentes:
          </p>
          <ul className="space-y-2 text-[12px] text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span><strong>IMSS:</strong> Trámites de semanas cotizadas y pensión en <a href="https://www.imss.gob.mx/" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-slate-900">www.imss.gob.mx</a> o en subdelegaciones.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span><strong>INFONAVIT:</strong> Consulta de saldo en Mi Cuenta Infonavit en <a href="https://portalmx.infonavit.org.mx/" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-slate-900">portalmx.infonavit.org.mx</a>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
              <span><strong>Conciliación Laboral:</strong> Centros Federal y Locales de Conciliación y Registro Laboral para mediación formal de liquidaciones.</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
};
