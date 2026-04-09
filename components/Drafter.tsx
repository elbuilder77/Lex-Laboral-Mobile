import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Book,
  Briefcase,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Download,
  Eye,
  FileText,
  Gavel,
  PenTool,
  Printer,
  RefreshCw,
  Scale,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { draftLegalDocument } from '../services/gemini';
import { NotificationType, DraftingState } from '../types';
import { useAuth } from './AuthProvider';
import { SEOContentSection } from './SEOContentSection';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';
import { cn } from '../lib/cn';

interface DrafterProps {
  state: DraftingState;
  setState: React.Dispatch<React.SetStateAction<DraftingState>>;
  notify: (m: string, t?: NotificationType, tit?: string) => void;
  onUpgrade?: (plan?: 'draft_basic' | 'mensualidad' | 'trimestralidad') => void;
  onAuthRequired?: () => void;
}

type DraftingModel = {
  id: string;
  title: string;
  icon: React.ReactNode;
  basePrompt: string;
  summary: string;
  outcome: string;
  detailsPlaceholder: string;
  previewSections: string[];
};

const DRAFTING_MODELS: DraftingModel[] = [
  {
    id: 'contrato',
    title: 'Contrato indeterminado',
    icon: <Users size={18} />,
    basePrompt: 'Contrato individual de trabajo por tiempo indeterminado conforme a la LFT.',
    summary: 'Para iniciar una relación laboral sin fecha fija de término.',
    outcome: 'Se proyectará un contrato base con datos del puesto, condiciones y cláusulas laborales.',
    detailsPlaceholder: 'Ejemplo: sueldo mensual, horario, lugar de trabajo, prestaciones pactadas y fecha de inicio.',
    previewSections: ['Partes y puesto', 'Condiciones de trabajo', 'Prestaciones y cláusulas base'],
  },
  {
    id: 'contrato_determinado',
    title: 'Contrato temporal',
    icon: <Clock size={18} />,
    basePrompt: 'Contrato individual de trabajo por tiempo u obra determinada conforme a la LFT.',
    summary: 'Para relaciones con fecha de término o proyecto específico.',
    outcome: 'Se enfocará en temporalidad, causa y condiciones esenciales.',
    detailsPlaceholder: 'Ejemplo: duración, causa de temporalidad, puesto, jornada y sueldo.',
    previewSections: ['Causa de temporalidad', 'Condiciones esenciales', 'Fecha o proyecto de cierre'],
  },
  {
    id: 'rescisión',
    title: 'Aviso de rescisión',
    icon: <ShieldAlert size={18} />,
    basePrompt: 'Aviso de rescisión de la relación laboral sin responsabilidad para el patrón, artículo 47 LFT.',
    summary: 'Para comunicar una rescisión patronal con causa.',
    outcome: 'El borrador priorizará hechos, fecha, conducta atribuida y fundamento legal.',
    detailsPlaceholder: 'Ejemplo: fecha del incumplimiento, conducta, evidencia disponible y antecedentes.',
    previewSections: ['Narración de hechos', 'Fecha y conducta atribuida', 'Fundamento laboral base'],
  },
  {
    id: 'renuncia',
    title: 'Carta de renuncia',
    icon: <UserMinus size={18} />,
    basePrompt: 'Carta de renuncia voluntaria al empleo y ratificación de no adeudo de prestaciones.',
    summary: 'Para formalizar una salida voluntaria.',
    outcome: 'Se redactará una carta breve con voluntad expresa y cierre claro.',
    detailsPlaceholder: 'Ejemplo: fecha de renuncia, último día laborado y aclaraciones importantes.',
    previewSections: ['Voluntad expresa', 'Fecha de salida', 'Manifestaciones finales'],
  },
  {
    id: 'convenio',
    title: 'Convenio de finiquito',
    icon: <Coins size={18} />,
    basePrompt: 'Convenio de terminación de la relación laboral por mutuo consentimiento con desglose de finiquito.',
    summary: 'Para cerrar una relación por acuerdo entre ambas partes.',
    outcome: 'Se integrará un convenio base con monto, forma de pago y manifestaciones principales.',
    detailsPlaceholder: 'Ejemplo: fecha de terminación, monto, conceptos pagados y forma de entrega.',
    previewSections: ['Datos de terminación', 'Monto y conceptos', 'Manifestaciones de cierre'],
  },
  {
    id: 'acta_admin',
    title: 'Acta administrativa',
    icon: <AlertTriangle size={18} />,
    basePrompt: 'Acta administrativa laboral por incumplimiento de obligaciones o faltas al reglamento interior.',
    summary: 'Para documentar hechos relevantes dentro de la empresa.',
    outcome: 'Se redactará un acta base con cronología, asistentes y descripción de hechos.',
    detailsPlaceholder: 'Ejemplo: fecha, personas presentes, conducta observada y documento interno relacionado.',
    previewSections: ['Personas asistentes', 'Cronología de hechos', 'Medidas o seguimiento'],
  },
  {
    id: 'reglamento',
    title: 'Reglamento interior',
    icon: <Book size={18} />,
    basePrompt: 'Reglamento Interior de Trabajo básico con normas de disciplina, horarios y medidas de seguridad.',
    summary: 'Para crear un reglamento general de trabajo.',
    outcome: 'Se estructurará un reglamento base con capítulos y reglas comunes.',
    detailsPlaceholder: 'Ejemplo: horarios, faltas, medidas disciplinarias, seguridad e higiene y descansos.',
    previewSections: ['Horarios y disciplina', 'Seguridad e higiene', 'Reglas y sanciones'],
  },
  {
    id: 'demanda',
    title: 'Demanda por despido',
    icon: <Gavel size={18} />,
    basePrompt: 'Escrito inicial de demanda laboral por despido injustificado (indemnización, salarios caídos).',
    summary: 'Para proyectar una demanda inicial en un conflicto laboral.',
    outcome: 'Se priorizarán hechos, prestaciones reclamadas y base legal del caso.',
    detailsPlaceholder: 'Ejemplo: fecha del despido, salario, puesto, antigüedad y prestaciones reclamadas.',
    previewSections: ['Hechos base', 'Prestaciones reclamadas', 'Peticiones y sustento inicial'],
  },
];

const stepLabel = (step: string, title: string, description: string) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{step}</p>
    <h3 className="mt-2 text-sm font-bold text-slate-950">{title}</h3>
    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
  </div>
);

export const Drafter = React.memo<DrafterProps>(({ state, setState, notify, onUpgrade, onAuthRequired }) => {
  const { prompt, generatedDoc } = state;
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { user, access, refreshAccess } = useAuth();

  const [selectedTemplate, setSelectedTemplate] = useState('contrato');
  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [details, setDetails] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const selectedModel = useMemo(
    () => DRAFTING_MODELS.find((model) => model.id === selectedTemplate) || DRAFTING_MODELS[0],
    [selectedTemplate]
  );

  const accessCopy = access.hasActiveSubscription
    ? 'Tu plan activo permite generar documentos sin compras adicionales.'
    : access.singleDocumentUsesRemaining > 0
      ? `Tienes ${access.singleDocumentUsesRemaining} documento${access.singleDocumentUsesRemaining === 1 ? '' : 's'} disponible${access.singleDocumentUsesRemaining === 1 ? '' : 's'}.`
      : 'Necesitas un documento suelto o un plan activo para generar este documento.';

  const setGeneratedDoc = useCallback((document: string) => {
    setState((prev) => ({ ...prev, generatedDoc: document }));
  }, [setState]);

  useEffect(() => {
    let assembledPrompt = selectedModel.basePrompt;

    if (employeeName.trim()) assembledPrompt += `\nNombre principal: ${employeeName.trim()}`;
    if (position.trim()) assembledPrompt += `\nPuesto o relación: ${position.trim()}`;
    if (details.trim()) assembledPrompt += `\nHechos del caso:\n${details.trim()}`;

    setState((prev) => ({ ...prev, prompt: assembledPrompt }));
  }, [selectedModel, employeeName, position, details, setState]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(state.generatedDoc);
    notify('Texto copiado', 'success');
  }, [state.generatedDoc, notify]);

  const handleDownload = useCallback(() => {
    const file = new Blob([state.generatedDoc], { type: 'text/plain' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(file);
    element.download = `LexLaboral_Instrumento_${selectedTemplate}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    notify('Descarga iniciada', 'success');
  }, [notify, selectedTemplate, state.generatedDoc]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDraft = useCallback(async () => {
    if (!prompt.trim()) return;

    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (!access.hasActiveSubscription && access.singleDocumentUsesRemaining <= 0) {
      onUpgrade?.('draft_basic');
      return;
    }

    setIsDrafting(true);
    try {
      notify('Generando documento...', 'info', 'Lex Laboral');
      const document = await draftLegalDocument(prompt, customInstructions);
      await refreshAccess();
      setGeneratedDoc(document);
      notify('Documento generado correctamente', 'success', 'Listo');
    } catch (error) {
      console.error('Drafting Error:', error);
      notify('No fue posible generar el documento. Revisa los datos o intenta de nuevo.', 'error');
    } finally {
      setIsDrafting(false);
    }
  }, [access, customInstructions, notify, onAuthRequired, onUpgrade, prompt, refreshAccess, setGeneratedDoc, user]);

  return (
    <WorkspacePage className="no-print">
      <WorkspaceHeader
        eyebrow="Documentos laborales"
        title="Generador documental"
        description="Selecciona el documento, captura los datos clave y revisa el resultado."
        icon={<Scale size={28} />}
        actions={
          <button
            onClick={() => onUpgrade?.()}
            className="group inline-flex items-center gap-3 rounded-[1.3rem] border border-slate-200/80 bg-white/90 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white"
          >
            <Sparkles size={16} className="text-legal-gold transition-transform group-hover:scale-110" />
            Ver planes
            <ChevronRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1" />
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-8">
          <WorkspacePanel className="space-y-8 p-8">
            {stepLabel('Paso 1', 'Elige el documento', 'Selecciona el formato que necesitas.')}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DRAFTING_MODELS.map((model) => {
                const isActive = selectedTemplate === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedTemplate(model.id)}
                    className={cn(
                      'rounded-[1.5rem] border px-4 py-4 text-left transition-all',
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.9)]'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5 flex h-10 w-10 items-center justify-center rounded-[1rem]', isActive ? 'bg-white/10 text-legal-gold' : 'bg-slate-50 text-slate-500')}>
                        {model.icon}
                      </div>
                      <div>
                        <h3 className={cn('text-sm font-bold', isActive ? 'text-white' : 'text-slate-950')}>{model.title}</h3>
                        <p className={cn('mt-1 text-xs leading-5', isActive ? 'text-slate-300' : 'text-slate-500')}>{model.summary}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </WorkspacePanel>

          <WorkspacePanel className="space-y-6 p-8">
            {stepLabel('Paso 2', 'Captura los datos clave', 'Completa lo necesario y agrega precisión solo si hace falta.')}

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                <div className="grid gap-4 2xl:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ui-label">Nombre principal</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={employeeName}
                        onChange={(event) => setEmployeeName(event.target.value)}
                        placeholder="Persona o empresa principal"
                        className="ui-input w-full pl-11 pr-4"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ui-label">Puesto o relación</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={position}
                        onChange={(event) => setPosition(event.target.value)}
                        placeholder="Puesto, cargo o vínculo"
                        className="ui-input w-full pl-11 pr-4"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ui-label">Hechos importantes</label>
                  <textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    placeholder={selectedModel.detailsPlaceholder}
                    className="ui-input min-h-[136px] resize-none px-5 py-4 leading-7"
                  />
                </div>

                <div className="space-y-2">
                  <label className="ui-label">Precisión adicional</label>
                  <textarea
                    value={customInstructions}
                    onChange={(event) => setCustomInstructions(event.target.value)}
                    placeholder="Opcional: cláusula, tono o dato extra."
                    className="ui-input min-h-[96px] resize-none px-5 py-4 leading-7"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="ui-subtle-block p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Acceso</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{accessCopy}</p>
                </div>

                <div className="ui-subtle-block p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Qué conviene incluir</p>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                    <li>Fechas clave</li>
                    <li>Monto, salario o forma de pago</li>
                    <li>Qué ocurrió y qué quieres dejar asentado</li>
                  </ul>
                </div>

                <button
                  onClick={handleDraft}
                  disabled={isDrafting}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-legal-950 to-slate-900 px-6 py-5 font-bold text-white shadow-[0_25px_55px_-28px_rgba(15,23,42,0.85)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  {isDrafting ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} className="text-legal-gold transition-transform group-hover:translate-x-1" />}
                  <span>{isDrafting ? 'Generando documento...' : 'Generar documento'}</span>
                </button>
              </div>
            </div>
          </WorkspacePanel>
        </div>

        <div className="lg:col-span-7">
          <WorkspacePanel className="flex h-full min-h-[760px] flex-col overflow-hidden rounded-[2.4rem]">
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/85 px-8 py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Resultado</p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">
                  {generatedDoc ? 'Borrador listo para revisión' : selectedModel.title}
                </h3>
              </div>

              {generatedDoc ? (
                <div className="flex gap-2">
                  <button onClick={() => setIsPreviewOpen(true)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <Eye size={16} />
                      Vista amplia
                    </span>
                  </button>
                  <button onClick={handleCopy} className="rounded-xl p-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900" title="Copiar">
                    <Copy size={18} />
                  </button>
                  <button onClick={handlePrint} className="rounded-xl p-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900" title="Imprimir">
                    <Printer size={18} />
                  </button>
                  <button onClick={handleDownload} className="rounded-xl p-2.5 text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700" title="Descargar">
                    <Download size={18} />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="relative flex-1 overflow-y-auto bg-[#FAFAFA] p-8 lg:p-12">
              {isDrafting ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-legal-gold border-t-transparent animate-spin" />
                    <Scale size={24} className="animate-pulse text-legal-950" />
                  </div>
                  <h4 className="mt-6 text-lg font-serif font-bold text-legal-950">Ordenando el documento</h4>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Estructura laboral base</p>
                </div>
              ) : generatedDoc ? (
                <div className="mx-auto my-8 max-w-[210mm] animate-in fade-in duration-700">
                  <div className="min-h-[297mm] rounded-sm border border-slate-200 bg-white p-[20mm] shadow-xl">
                    <div className="markdown-body prose prose-slate prose-sm max-w-none md:prose-base prose-headings:font-serif prose-headings:text-slate-900 prose-p:leading-[1.8] prose-p:text-justify">
                      <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <WorkspaceEmpty
                    icon={<FileText size={44} />}
                    title="Vista previa del documento"
                    description="Completa los datos y aquí aparecerá el resultado."
                    className="min-h-[280px]"
                  />

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_280px]">
                    <div className="ui-subtle-block p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Documento</p>
                          <h4 className="mt-3 text-xl font-bold text-slate-950">{selectedModel.title}</h4>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          Vista previa
                        </span>
                      </div>
                          <p className="mt-3 text-sm leading-7 text-slate-700">{selectedModel.outcome}</p>

                      <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                        {selectedModel.previewSections.map((section) => (
                          <div key={section} className="rounded-[1.3rem] border border-slate-200/80 bg-white px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Incluye</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{section}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ui-subtle-block p-6">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Resultado</p>
                      <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                        <li>Documento editable</li>
                        <li>Estructura laboral mexicana</li>
                        <li>Listo para revisión</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WorkspacePanel>
        </div>
      </div>

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-legal-950/65 p-4 backdrop-blur-md sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="flex h-full max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.4rem] border border-white/10 bg-slate-100 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-slate-950 shadow-md">
                    <Eye className="text-legal-gold" size={22} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-slate-900">Vista profesional</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Formato de impresión A4</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-2xl p-3 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#F1F5F9] p-8 sm:p-12 no-scrollbar">
                <div className="mx-auto min-h-[297mm] max-w-[210mm] rounded-sm border border-slate-200 bg-white p-[25mm] shadow-2xl">
                  <div className="markdown-body prose prose-slate prose-sm max-w-none md:prose-base prose-headings:font-serif prose-headings:text-slate-900 prose-p:leading-[1.8] prose-p:text-justify">
                    <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 border-t border-slate-200 bg-white px-8 py-5">
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-2xl px-8 py-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 transition-all hover:bg-slate-50"
                >
                  Regresar
                </button>
                <div className="h-8 w-px bg-slate-200" />
                <button
                  onClick={() => {
                    handleCopy();
                    setIsPreviewOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-legal-950 px-8 py-4 text-xs font-bold uppercase tracking-[0.22em] text-legal-gold shadow-[0_24px_50px_-28px_rgba(15,23,42,0.85)] transition-all hover:bg-slate-900"
                >
                  <Copy size={18} />
                  <span>Copiar contenido</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .markdown-body { font-size: 12pt !important; line-height: 1.8 !important; color: black !important; }
          @page { margin: 2.5cm; }
        }
      `}</style>

      <SEOContentSection
        title="Generador de documentos legales laborales con IA"
        intro="El generador de documentos de Lex Laboral está orientado a borradores laborales frecuentes en México. Ayuda a estructurar contratos, convenios, cartas y escritos iniciales con un formato más consistente, para que el usuario jurídico parta de una base editable antes de su revisión final."
        highlights={[
          {
            title: 'Documentos frecuentes',
            body: 'Permite proyectar contratos individuales, convenios de terminación, cartas de renuncia, avisos de rescisión, reglamentos y demandas laborales.',
          },
          {
            title: 'Enfoque laboral mexicano',
            body: 'El copy y la estructura están orientados a documentos de trabajo con referencias comunes a la Ley Federal del Trabajo y práctica documental mexicana.',
          },
          {
            title: 'Modelo de acceso',
            body: 'Se puede usar mediante documento suelto o con plan mensual o trimestral activo, según el producto adquirido por el usuario.',
          },
        ]}
        faqs={[
          {
            question: 'Que documentos puede generar Lex Laboral?',
            answer: 'Puede ayudarte a elaborar borradores de contratos, convenios, cartas de renuncia, actas administrativas, reglamentos y otros documentos laborales frecuentes.',
          },
          {
            question: 'El generador reemplaza la revision de un abogado?',
            answer: 'No. El texto generado debe revisarse y ajustarse al caso concreto, a la estrategia jurídica y a la documentación disponible antes de usarse formalmente.',
          },
          {
            question: 'Puedo usar el generador sin suscripcion?',
            answer: 'Sí, mediante la compra de un documento suelto. También queda disponible de forma amplia con plan mensual o trimestral activo.',
          },
        ]}
      />
    </WorkspacePage>
  );
});
