import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Copy, Download, FileText, PenLine, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { draftLegalDocument } from '../services/gemini';
import type { CalculationKind, CalculationRecord, DraftingState, NotificationType } from '../types';
import { cn } from '../lib/cn';

interface DrafterProps {
  state: DraftingState;
  setState: React.Dispatch<React.SetStateAction<DraftingState>>;
  notify: (message: string, type?: NotificationType, title?: string) => void;
  calculation: CalculationRecord | null;
}

type CalculationTemplate = {
  id: string;
  kind: CalculationKind;
  title: string;
  purpose: string;
  instruction: string;
};

const TEMPLATES: CalculationTemplate[] = [
  { id: 'labor_agreement', kind: 'labor', title: 'Convenio de terminación', purpose: 'Formaliza el pago calculado y el cierre de la relación.', instruction: 'Redacta un convenio de terminación laboral con desglose del cálculo, forma de pago, manifestaciones y espacios de firma.' },
  { id: 'labor_receipt', kind: 'labor', title: 'Recibo y desglose', purpose: 'Entrega una constancia clara de conceptos y total neto.', instruction: 'Redacta un recibo de finiquito o liquidación con desglose de conceptos, retenciones y total neto.' },
  { id: 'labor_resignation', kind: 'labor', title: 'Renuncia con finiquito', purpose: 'Vincula la salida voluntaria con las cantidades calculadas.', instruction: 'Redacta una carta de renuncia voluntaria con reconocimiento del finiquito calculado, sin incluir renuncias de derechos inválidas.' },
  { id: 'imss_report', kind: 'social_security', title: 'Reporte de cuotas', purpose: 'Documenta las cuotas patronales y obreras del periodo.', instruction: 'Redacta un reporte técnico de cuotas IMSS e INFONAVIT con datos base, desglose y totales.' },
  { id: 'imss_determination', kind: 'social_security', title: 'Cédula de determinación', purpose: 'Presenta el cálculo para revisión interna del patrón.', instruction: 'Redacta una cédula interna de determinación de cuotas con metodología, periodo y cifras calculadas.' },
  { id: 'pension_review', kind: 'pension', title: 'Solicitud de revisión', purpose: 'Solicita al IMSS la revisión de semanas, régimen y cuantía.', instruction: 'Redacta una solicitud formal al IMSS para revisar régimen, semanas cotizadas y cuantía estimada de pensión.' },
  { id: 'pension_report', kind: 'pension', title: 'Reporte de estimación', purpose: 'Resume escenarios y datos utilizados en la estimación.', instruction: 'Redacta un reporte informativo de estimación de pensión, supuestos, datos de entrada, resultado y advertencia de cálculo no oficial.' },
];

const money = (value: unknown) => typeof value === 'number'
  ? value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
  : String(value ?? '—');

const getHighlights = (calculation: CalculationRecord) => {
  const r = calculation.results as Record<string, any>;
  if (calculation.kind === 'labor') return [
    ['Finiquito', money(r.finiquito)], ['Liquidación', money(r.liquidacion)], ['Total neto', money(r.total)],
  ];
  if (calculation.kind === 'social_security') return [
    ['Patrón', money(r.employer?.total)], ['Trabajador', money(r.employee?.total)], ['Total', money(r.total)],
  ];
  return [
    ['Pensión mensual', money(r.monthlyPension)], ['Régimen', `Ley ${r.regimeUsed ?? '—'}`], ['Factor de edad', `${r.agePercentage ?? '—'}%`],
  ];
};

export const Drafter = React.memo<DrafterProps>(({ state, setState, notify, calculation }) => {
  const availableTemplates = useMemo(
    () => calculation ? TEMPLATES.filter(template => template.kind === calculation.kind) : [],
    [calculation],
  );
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [personName, setPersonName] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'result'>('form');
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    if (availableTemplates.length && !availableTemplates.some(item => item.id === selectedTemplate)) {
      setSelectedTemplate(availableTemplates[0].id);
    }
  }, [availableTemplates, selectedTemplate]);

  const template = availableTemplates.find(item => item.id === selectedTemplate);
  const highlights = calculation ? getHighlights(calculation) : [];

  useEffect(() => {
    if (!calculation || !template) return;
    const prompt = [
      template.instruction,
      'Usa exclusivamente los datos del cálculo adjunto. No inventes importes, fechas ni hechos.',
      `Tipo de cálculo: ${calculation.title}`,
      `Fecha del cálculo: ${new Date(calculation.createdAt).toLocaleString('es-MX')}`,
      `Datos de entrada: ${JSON.stringify(calculation.inputs)}`,
      `Resultados: ${JSON.stringify(calculation.results)}`,
      personName && `Persona trabajadora o asegurada: ${personName}`,
      employerName && `Patrón o empresa: ${employerName}`,
      reference && `Lugar, expediente o referencia: ${reference}`,
      notes && `Notas complementarias: ${notes}`,
      'Incluye una nota visible indicando que las cifras provienen de una estimación de Lex Laboral y requieren revisión profesional.',
    ].filter(Boolean).join('\n');
    setState(previous => ({ ...previous, prompt }));
  }, [calculation, employerName, notes, personName, reference, setState, template]);

  const handleDraft = async () => {
    if (!calculation || !template || !personName.trim()) {
      notify('Indica el nombre de la persona para continuar.', 'warning');
      return;
    }
    setIsDrafting(true);
    setActiveTab('result');
    setState(previous => ({ ...previous, generatedDoc: '' }));
    try {
      const document = await draftLegalDocument(state.prompt, undefined, chunk => {
        setState(previous => ({ ...previous, generatedDoc: chunk }));
      });
      setState(previous => ({ ...previous, generatedDoc: document }));
      notify('Documento generado con los datos del cálculo.', 'success');
    } catch (error: any) {
      notify(error?.message || 'No fue posible generar el documento.', 'error');
      setActiveTab('form');
    } finally {
      setIsDrafting(false);
    }
  };

  const copyDocument = useCallback(async () => {
    await navigator.clipboard.writeText(state.generatedDoc);
    notify('Documento copiado.', 'success');
  }, [notify, state.generatedDoc]);

  const downloadDocument = useCallback(() => {
    const url = URL.createObjectURL(new Blob([state.generatedDoc], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `LexLaboral_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedTemplate, state.generatedDoc]);

  return (
    <div className="min-h-full bg-[#fbfaf7] pb-28 text-slate-950">
      <header className="bg-[#070d1c] px-5 pb-5 pt-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-legal-gold text-slate-950"><FileText size={22} /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-legal-gold">Desde tus cálculos</p><h1 className="text-2xl font-serif font-bold">Crear documento</h1></div>
        </div>
        <div className="mt-5 flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button onClick={() => setActiveTab('form')} className={cn('min-h-11 flex-1 rounded-lg text-xs font-bold', activeTab === 'form' ? 'bg-legal-gold text-slate-950' : 'text-slate-300')}>Preparar</button>
          <button onClick={() => setActiveTab('result')} className={cn('min-h-11 flex-1 rounded-lg text-xs font-bold', activeTab === 'result' ? 'bg-legal-gold text-slate-950' : 'text-slate-300')}>Documento</button>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 pt-5">
        {activeTab === 'form' ? (
          !calculation ? (
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Calculator size={26} /></div>
              <h2 className="mt-4 text-xl font-serif font-bold">Primero realiza un cálculo</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">El generador sólo crea documentos vinculados a Liquidación, IMSS/INFONAVIT o Pensión.</p>
            </section>
          ) : (
            <>
              <section className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-md">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-legal-gold">Cálculo importado</p><h2 className="mt-1 text-lg font-serif font-bold">{calculation.title}</h2></div><CheckCircle2 className="text-legal-gold" size={22} /></div>
                <div className="mt-4 grid grid-cols-3 gap-2">{highlights.map(([label, value]) => <div key={label} className="rounded-xl bg-white/7 p-3"><p className="text-[9px] uppercase text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-bold">{value}</p></div>)}</div>
              </section>

              <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Documento</p>
                <div className="mt-3 space-y-2">{availableTemplates.map(item => <button key={item.id} onClick={() => setSelectedTemplate(item.id)} className={cn('flex min-h-[68px] w-full items-center gap-3 rounded-2xl border p-3 text-left', selectedTemplate === item.id ? 'border-legal-gold bg-amber-50' : 'border-slate-200 bg-white')}><div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', selectedTemplate === item.id ? 'bg-legal-gold text-slate-950' : 'bg-slate-100 text-slate-500')}><PenLine size={18} /></div><div><p className="text-sm font-bold">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{item.purpose}</p></div></button>)}</div>
              </section>

              <section className="space-y-3 rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Datos complementarios</p>
                <input value={personName} onChange={event => setPersonName(event.target.value)} placeholder="Nombre de la persona *" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-legal-gold" />
                <input value={employerName} onChange={event => setEmployerName(event.target.value)} placeholder="Patrón o empresa" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-legal-gold" />
                <input value={reference} onChange={event => setReference(event.target.value)} placeholder="Lugar, expediente o referencia" className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-legal-gold" />
                <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Notas complementarias" className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-legal-gold" />
              </section>

              <button onClick={handleDraft} disabled={isDrafting} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-legal-gold shadow-lg disabled:opacity-50"><Sparkles size={18} /> Generar con este cálculo <Send size={16} /></button>
            </>
          )
        ) : (
          <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
            {isDrafting ? <div className="py-16 text-center"><Sparkles className="mx-auto animate-pulse text-legal-gold" size={30} /><p className="mt-4 font-bold">Generando documento…</p><p className="mt-1 text-xs text-slate-500">Integrando las cifras del cálculo</p></div> : state.generatedDoc ? <><div className="prose prose-sm max-w-none text-slate-800"><ReactMarkdown>{state.generatedDoc}</ReactMarkdown></div><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={copyDocument} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold"><Copy size={16} /> Copiar</button><button onClick={downloadDocument} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-legal-gold"><Download size={16} /> Descargar</button></div></> : <div className="py-14 text-center text-sm text-slate-500">Prepara un documento para ver aquí el resultado.</div>}
          </section>
        )}
      </main>
    </div>
  );
});

Drafter.displayName = 'Drafter';
