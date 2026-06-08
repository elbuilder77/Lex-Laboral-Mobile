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
  Layers,
  Database,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { draftLegalDocument } from '../services/gemini';
import { NotificationType, DraftingState } from '../types';
import { useAuth } from './AuthProvider';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';
import { cn } from '../lib/cn';

interface DrafterProps {
  state: DraftingState;
  setState: React.Dispatch<React.SetStateAction<DraftingState>>;
  notify: (m: string, t?: NotificationType, tit?: string) => void;
  onUpgrade?: (plan?: 'draft_basic' | 'mensualidad' | 'trimestralidad') => void;
  onAuthRequired?: () => void;
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'date';
  placeholder: string;
  gridSpan?: 'full' | 'half';
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
  fields?: TemplateField[];
};

const DRAFTING_MODELS: DraftingModel[] = [
  {
    id: 'contrato',
    title: 'Contrato indeterminado',
    icon: <Users size={16} />,
    basePrompt: 'Contrato individual de trabajo por tiempo indeterminado conforme a la LFT.',
    summary: 'Para iniciar una relación laboral sin fecha fija de término.',
    outcome: 'Se proyectará un contrato base con datos del puesto, condiciones y cláusulas laborales de la LFT.',
    detailsPlaceholder: 'Ejemplo: detalles de prestaciones extraordinarias (vales de despensa, fondo de ahorro) y periodo de prueba.',
    previewSections: ['Partes y puesto', 'Condiciones de trabajo', 'Cláusulas y firmas base'],
    fields: [
      { id: 'start_date', label: 'Fecha de Inicio de Labores', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'salary_monthly', label: 'Sueldo Mensual Bruto (MXN)', type: 'number', placeholder: 'Ej. 18000', gridSpan: 'half' },
      { id: 'work_schedule', label: 'Jornada y Horario de Trabajo', type: 'text', placeholder: 'Ej. Lunes a Viernes de 9:00 a 18:00 hrs', gridSpan: 'full' },
      { id: 'work_location', label: 'Domicilio / Lugar de Trabajo', type: 'text', placeholder: 'Ej. Calle Reforma 123, Col. Centro, CDMX', gridSpan: 'full' }
    ]
  },
  {
    id: 'contrato_determinado',
    title: 'Contrato temporal',
    icon: <Clock size={16} />,
    basePrompt: 'Contrato individual de trabajo por tiempo u obra determinada conforme a la LFT.',
    summary: 'Para relaciones con fecha de término o proyecto específico.',
    outcome: 'Se enfocará en temporalidad, causa demostrable de temporalidad y condiciones de salida.',
    detailsPlaceholder: 'Ejemplo: detalles del proyecto o de la obra temporal, periodo de capacitación inicial.',
    previewSections: ['Causa justificada', 'Condiciones esenciales', 'Fecha de cierre pactada'],
    fields: [
      { id: 'start_date', label: 'Fecha de Inicio', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'duration', label: 'Duración Pactada (ej. 3 meses)', type: 'text', placeholder: 'Ej. 6 meses', gridSpan: 'half' },
      { id: 'justification', label: 'Causa Justificada de Temporalidad (Obligatorio LFT)', type: 'text', placeholder: 'Ej. Sustitución por incapacidad de maternidad de empleada Y / Proyecto temporal Z', gridSpan: 'full' },
      { id: 'salary_monthly', label: 'Sueldo Mensual Bruto (MXN)', type: 'number', placeholder: 'Ej. 15000', gridSpan: 'half' }
    ]
  },
  {
    id: 'rescisión',
    title: 'Aviso de rescisión',
    icon: <ShieldAlert size={16} />,
    basePrompt: 'Aviso de rescisión de la relación laboral sin responsabilidad para el patrón, artículo 47 LFT.',
    summary: 'Para comunicar una rescisión patronal con causa.',
    outcome: 'El borrador priorizará la cronología de hechos, fecha, conducta atribuida y fundamentación legal en el Art. 47.',
    detailsPlaceholder: 'Ejemplo: descripción cronológica detallada de las conductas específicas o incidentes que motivan el despido.',
    previewSections: ['Narración de hechos', 'Fechas exactas del desacato', 'Fundamento en Artículo 47'],
    fields: [
      { id: 'dismissal_date', label: 'Fecha Efectiva de Rescisión', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'offense_date', label: 'Fecha de Comisión de las Faltas', type: 'text', placeholder: 'Ej. 15, 18 y 19 de Mayo de 2026', gridSpan: 'half' },
      { id: 'lft_fraction', label: 'Fracción Aplicable del Art. 47 LFT', type: 'text', placeholder: 'Ej. Fracción X (más de 3 faltas injustificadas)', gridSpan: 'full' },
      { id: 'evidence_type', label: 'Pruebas / Evidencias (ej. reporte de asistencia)', type: 'text', placeholder: 'Ej. Reporte biométrico de asistencia y actas administrativas previas', gridSpan: 'full' }
    ]
  },
  {
    id: 'renuncia',
    title: 'Carta de renuncia',
    icon: <UserMinus size={16} />,
    basePrompt: 'Carta de renuncia voluntaria al empleo y ratificación de no adeudo de prestaciones.',
    summary: 'Para formalizar una salida voluntaria.',
    outcome: 'Se redactará un escrito formal que exprese la renuncia voluntaria liberando al patrón de reclamos futuros.',
    detailsPlaceholder: 'Ejemplo: si deseas incluir agradecimientos especiales o algún otro detalle aclaratorio.',
    previewSections: ['Voluntad expresa', 'Fecha de salida efectiva', 'Manifestaciones de no adeudo'],
    fields: [
      { id: 'last_day', label: 'Último Día Laborado Efectivo', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'reason', label: 'Motivo de la Renuncia (ej. motivos personales)', type: 'text', placeholder: 'Ej. Motivos de superación profesional / personales', gridSpan: 'half' }
    ]
  },
  {
    id: 'convenio',
    title: 'Convenio de finiquito',
    icon: <Coins size={16} />,
    basePrompt: 'Convenio de terminación de la relación laboral por mutuo consentimiento con desglose de finiquito.',
    summary: 'Para cerrar una relación por acuerdo mutuo.',
    outcome: 'Se integrará un convenio de finiquito formal con desglose de conceptos proporcionales y firmas de conformidad.',
    detailsPlaceholder: 'Ejemplo: detalles específicos del acuerdo bancario, firma ante tribunal conciliatorio, etc.',
    previewSections: ['Datos de terminación', 'Desglose de proporcionales', 'Firmas de ratificación'],
    fields: [
      { id: 'end_date', label: 'Fecha de Terminación Pactada', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'finiquito_amount', label: 'Monto Total del Finiquito (MXN)', type: 'number', placeholder: 'Ej. 24500.00', gridSpan: 'half' },
      { id: 'payment_method', label: 'Forma de Entrega de Pago', type: 'text', placeholder: 'Ej. Transferencia electrónica de fondos / Cheque de caja', gridSpan: 'full' }
    ]
  },
  {
    id: 'acta_admin',
    title: 'Acta administrativa',
    icon: <AlertTriangle size={16} />,
    basePrompt: 'Acta administrativa laboral por incumplimiento de obligaciones o faltas al reglamento interior.',
    summary: 'Para documentar faltas o hechos relevantes.',
    outcome: 'Se redactará un acta cronológica formal con asistentes, testigos, declaración del trabajador y medidas disciplinarias.',
    detailsPlaceholder: 'Ejemplo: declaración verbal o versión del trabajador ante la falta cometida.',
    previewSections: ['Asistentes y testigos', 'Cronología de hechos', 'Seguimiento disciplinario'],
    fields: [
      { id: 'incident_date', label: 'Fecha del Incidente/Falta', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'incident_time', label: 'Hora del Incidente', type: 'text', placeholder: 'Ej. 10:45 AM', gridSpan: 'half' },
      { id: 'witnesses', label: 'Nombres de Testigos de Asistencia', type: 'text', placeholder: 'Ej. Carlos Méndez (Supervisor) y Sofía Ruiz (Recursos Humanos)', gridSpan: 'full' },
      { id: 'rule_violated', label: 'Cláusula del Reglamento/Contrato Infringida', type: 'text', placeholder: 'Ej. Artículo 15 Fracción II del Reglamento Interior (uso de celular)', gridSpan: 'full' }
    ]
  },
  {
    id: 'reglamento',
    title: 'Reglamento interior',
    icon: <Book size={16} />,
    basePrompt: 'Reglamento Interior de Trabajo básico con normas de disciplina, horarios y medidas de seguridad.',
    summary: 'Para crear normas generales de trabajo.',
    outcome: 'Se estructurará un reglamento interior base con capítulos comunes de horarios, faltas y medidas de higiene.',
    detailsPlaceholder: 'Ejemplo: políticas de vestimenta, uso de herramientas, periodos vacacionales, normas específicas de la industria.',
    previewSections: ['Horarios y disciplina', 'Seguridad e higiene', 'Catálogo de sanciones'],
    fields: [
      { id: 'tolerance_minutes', label: 'Minutos de Tolerancia para Retardo', type: 'number', placeholder: 'Ej. 15', gridSpan: 'half' },
      { id: 'rest_day', label: 'Día de Descanso Semanal Fijo', type: 'text', placeholder: 'Ej. Domingo', gridSpan: 'half' },
      { id: 'pay_day', label: 'Días de Pago de Nómina', type: 'text', placeholder: 'Ej. Quincenal (días 15 y 30 de cada mes)', gridSpan: 'full' }
    ]
  },
  {
    id: 'demanda',
    title: 'Demanda por despido',
    icon: <Gavel size={16} />,
    basePrompt: 'Escrito inicial de demanda laboral por despido injustificado ante tribunal (indemnización, salarios caídos).',
    summary: 'Para proyectar una demanda inicial.',
    outcome: 'Se priorizarán las prestaciones constitucionales y la narración cronológica del despido con sustento legal de la LFT.',
    detailsPlaceholder: 'Ejemplo: hechos del despido injustificado (quién despidió, qué palabras se usaron, testigos presenciales).',
    previewSections: ['Hechos de contratación', 'Prestaciones reclamadas', 'Manifestaciones y derecho'],
    fields: [
      { id: 'hire_date', label: 'Fecha de Contratación', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'dismissal_date', label: 'Fecha del Despido', type: 'date', placeholder: '', gridSpan: 'half' },
      { id: 'salary_daily', label: 'Salario Diario Integrado (MXN)', type: 'number', placeholder: 'Ej. 650.00', gridSpan: 'half' },
      { id: 'lft_claims', label: 'Prestaciones Reclamadas principales', type: 'text', placeholder: 'Ej. Indemnización Constitucional, aguinaldo, vacaciones y prima de antigüedad', gridSpan: 'full' }
    ]
  }
];

const stepLabel = (step: string, title: string, description: string) => (
  <div>
    <span className="text-[9px] font-bold uppercase tracking-[0.26em] text-legal-gold bg-legal-gold/5 px-2.5 py-1 rounded-md border border-legal-gold/20">{step}</span>
    <h3 className="mt-3.5 text-sm font-bold text-slate-950">{title}</h3>
    <p className="mt-1 text-xs leading-relaxed text-slate-500 font-medium">{description}</p>
  </div>
);

export const Drafter = React.memo<DrafterProps>(({ state, setState, notify, onUpgrade, onAuthRequired }) => {
  const { prompt, generatedDoc } = state;
  const visualizerRef = React.useRef<HTMLDivElement>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { user, access, refreshAccess } = useAuth();

  const [selectedTemplate, setSelectedTemplate] = useState(() => localStorage.getItem('draft_template') || 'contrato');
  const [employeeName, setEmployeeName] = useState(() => localStorage.getItem('draft_employeeName') || '');
  const [position, setPosition] = useState(() => localStorage.getItem('draft_position') || '');
  const [details, setDetails] = useState(() => localStorage.getItem('draft_details') || '');
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem('draft_customInstructions') || '');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('draft_fieldValues');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('draft_template', selectedTemplate);
    localStorage.setItem('draft_employeeName', employeeName);
    localStorage.setItem('draft_position', position);
    localStorage.setItem('draft_details', details);
    localStorage.setItem('draft_customInstructions', customInstructions);
    localStorage.setItem('draft_fieldValues', JSON.stringify(fieldValues));
  }, [selectedTemplate, employeeName, position, details, customInstructions, fieldValues]);

  // RAG Scanner state variables for premium simulation
  const [ragStep, setRagStep] = useState(1);

  const selectedModel = useMemo(
    () => DRAFTING_MODELS.find((model) => model.id === selectedTemplate) || DRAFTING_MODELS[0],
    [selectedTemplate]
  );

  const accessCopy = access.hasActiveSubscription
    ? 'Tienes acceso Premium activo. Puedes generar borradores ilimitados.'
    : access.singleDocumentUsesRemaining > 0
      ? `Tienes ${access.singleDocumentUsesRemaining} saldo${access.singleDocumentUsesRemaining === 1 ? '' : 's'} disponible${access.singleDocumentUsesRemaining === 1 ? '' : 's'} para generar.`
      : 'Requiere saldo documental o un plan mensual activo para generar.';

  useEffect(() => {
    let assembledPrompt = selectedModel.basePrompt;

    if (employeeName.trim()) assembledPrompt += `\nNombre principal (persona/empresa): ${employeeName.trim()}`;
    if (position.trim()) assembledPrompt += `\nPuesto o relación: ${position.trim()}`;

    // Add dynamic field values
    const activeFields = selectedModel.fields || [];
    activeFields.forEach((field) => {
      const val = fieldValues[field.id]?.trim();
      if (val) {
        assembledPrompt += `\n${field.label}: ${val}`;
      }
    });

    if (details.trim()) assembledPrompt += `\nHechos y detalles adicionales del caso:\n${details.trim()}`;

    setState((prev) => ({ ...prev, prompt: assembledPrompt }));
  }, [selectedModel, employeeName, position, details, fieldValues, setState]);

  // RAG steps animation loop during drafting
  useEffect(() => {
    if (!isDrafting) {
      setRagStep(1);
      return;
    }
    const interval = setInterval(() => {
      setRagStep((prev) => (prev < 3 ? prev + 1 : 3));
    }, 1500);
    return () => clearInterval(interval);
  }, [isDrafting]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(state.generatedDoc);
    notify('Texto copiado al portapapeles', 'success');
  }, [state.generatedDoc, notify]);

  const handleDownload = useCallback(() => {
    const file = new Blob([state.generatedDoc], { type: 'text/plain' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(file);
    element.download = `LexLaboral_Borrador_${selectedTemplate}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    notify('Borrador descargado correctamente', 'success');
  }, [notify, selectedTemplate, state.generatedDoc]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const setGeneratedDoc = useCallback((document: string) => {
    setState((prev) => ({ ...prev, generatedDoc: document }));
  }, [setState]);

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
    setTimeout(() => {
      visualizerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    try {
      notify('Iniciando Inteligencia Jurídica RAG...', 'info', 'Lex Laboral');
      const document = await draftLegalDocument(prompt, customInstructions, (chunk) => {
        setGeneratedDoc(chunk);
      });
      await refreshAccess();
      // Clear persistence after successful draft
      localStorage.removeItem('draft_details');
      localStorage.removeItem('draft_customInstructions');
      setGeneratedDoc(document);
      notify('Borrador generado con referencias LFT/IMSS', 'success', 'Listo');
    } catch (error: any) {
      console.error('Drafting Error:', error);
      notify(error?.message || 'Error al contactar con la API de Gemini.', 'error');
    } finally {
      setIsDrafting(false);
    }
  }, [access, customInstructions, notify, onAuthRequired, onUpgrade, prompt, refreshAccess, setGeneratedDoc, user]);

  return (
    <WorkspacePage className="font-sans bg-[#FAFBFD]">
      <div className="no-print">
        <WorkspaceHeader
          eyebrow="Redacción Inteligente"
          title="Generador de Documentos"
          description="Selecciona un formato legal, captura la información y genera un borrador fundado en la Ley Federal del Trabajo y del IMSS en segundos."
          icon={<Scale size={26} className="text-legal-gold" />}
          actions={
            <button
              onClick={() => onUpgrade?.()}
              className="group inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:border-legal-gold/40"
            >
              <Sparkles size={14} className="text-legal-gold transition-transform group-hover:scale-110" />
              <span>Ver planes de acceso</span>
              <ChevronRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 mt-4">
        {/* Left Column: Input Form & Template Selector */}
        <div className="lg:col-span-5 space-y-6 no-print">
          
          {/* STEP 1: SELECTOR DE PLANTILLA */}
          <WorkspacePanel className="p-6 border border-slate-200/60 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm space-y-6">
            {stepLabel('Paso 1', 'Selecciona la plantilla legal', 'Elige el formato básico que necesitas proyectar.')}

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {DRAFTING_MODELS.map((model) => {
                const isActive = selectedTemplate === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedTemplate(model.id)}
                    className={cn(
                      'rounded-xl border p-4.5 text-left transition-all duration-200 flex flex-col justify-between h-full min-h-[96px]',
                      isActive
                        ? 'border-slate-900 bg-slate-950 text-white shadow-[0_15px_30px_-16px_rgba(15,23,42,0.95)]'
                        : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-start gap-3.5 w-full">
                      {/* Cohesive Dark/Gold Icon Chip matching LexCorporativo */}
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', isActive ? 'bg-white/10 border-white/15 text-legal-gold' : 'bg-slate-50 border-slate-200 text-slate-500')}>
                        {model.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={cn('text-xs font-bold tracking-wide', isActive ? 'text-white' : 'text-slate-950')}>{model.title}</h3>
                        <p className={cn('mt-1.5 text-[10px] leading-relaxed font-medium', isActive ? 'text-slate-300' : 'text-slate-500')}>{model.summary}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </WorkspacePanel>

          {/* STEP 2: CAPTURA DE DATOS */}
          <WorkspacePanel className="p-6 border border-slate-200/60 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm space-y-6">
            {stepLabel('Paso 2', 'Captura los hechos y detalles clave', 'Escribe los datos indispensables y deja que la IA haga el resto.')}

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ui-label text-[10px]">Persona / Empresa Principal</label>
                  <div className="relative">
                    <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(event) => setEmployeeName(event.target.value)}
                      placeholder="Ej. Juan Pérez / Empresa S.A."
                      className="ui-input w-full pl-11 pr-4 py-3 rounded-xl border-slate-200/80 focus:border-legal-gold/60 focus:ring-4 focus:ring-legal-gold/5"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ui-label text-[10px]">Puesto / Relación</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={position}
                      onChange={(event) => setPosition(event.target.value)}
                      placeholder="Ej. Gerente de Ventas / Chofer"
                      className="ui-input w-full pl-11 pr-4 py-3 rounded-xl border-slate-200/80 focus:border-legal-gold/60 focus:ring-4 focus:ring-legal-gold/5"
                    />
                  </div>
                </div>
              </div>

              {/* Campos dinámicos específicos de la plantilla */}
              {selectedModel.fields && selectedModel.fields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 border border-slate-200/40 rounded-xl p-4.5">
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-legal-gold">Variables del documento</span>
                  </div>
                  {selectedModel.fields.map((field) => {
                    const value = fieldValues[field.id] || '';
                    const isFull = field.gridSpan === 'full';
                    return (
                      <div key={field.id} className={cn("space-y-1.5", isFull ? "col-span-1 sm:col-span-2" : "col-span-1")}>
                        <label className="ui-label text-[10px]">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={value}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="ui-input w-full min-h-[80px] resize-none px-3.5 py-2.5 rounded-xl border-slate-200/80 leading-relaxed text-xs focus:border-legal-gold/60 focus:ring-4 focus:ring-legal-gold/5"
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={value}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="ui-input w-full px-3.5 py-2.5 rounded-xl border-slate-200/80 text-xs focus:border-legal-gold/60 focus:ring-4 focus:ring-legal-gold/5"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="ui-label text-[10px]">Hechos o detalles adicionales (Opcional)</label>
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder={selectedModel.detailsPlaceholder}
                  className="ui-input w-full min-h-[100px] resize-none px-4.5 py-3.5 rounded-xl border-slate-200/80 leading-relaxed text-xs focus:border-legal-gold/60 focus:ring-4 focus:ring-legal-gold/5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ui-label text-[10px]">Instrucciones especiales para la IA (Opcional)</label>
                <textarea
                  value={customInstructions}
                  onChange={(event) => setCustomInstructions(event.target.value)}
                  placeholder="Ej. Tono formal, incluir cláusula de confidencialidad, sueldo integrado, etc."
                  className="ui-input w-full min-h-[80px] resize-none px-4.5 py-3.5 rounded-xl border-slate-200/80 leading-relaxed text-xs focus:border-legal-gold/60 focus:ring-4 focus:ring-legal-gold/5"
                />
              </div>

              <div className="h-px bg-slate-200/80 my-2" />

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white/50 p-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Estado de Saldo</span>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 font-semibold">{accessCopy}</p>
                </div>

                <button
                  onClick={handleDraft}
                  disabled={isDrafting || !prompt.trim()}
                  className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-white/5 px-5 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 hover:shadow-[0_15px_30px_-12px_rgba(212,175,55,0.25)]"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  {isDrafting ? (
                    <RefreshCw className="animate-spin text-legal-gold" size={16} />
                  ) : (
                    <Send size={15} className="text-legal-gold transition-transform group-hover:translate-x-0.5" />
                  )}
                  <span>{isDrafting ? 'Escaneando RAG...' : 'Generar Borrador'}</span>
                </button>
              </div>
            </div>
          </WorkspacePanel>
        </div>

        {/* Right Column: Premium Legal Workspace Preview */}
        <div ref={visualizerRef} className="lg:col-span-7">
          <WorkspacePanel className="flex h-full min-h-[760px] flex-col overflow-hidden border border-slate-200/60 bg-[#F4F6F9] rounded-2xl shadow-sm print:bg-white print:border-none print:shadow-none print:h-auto print:min-h-0">
            
            {/* Output Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-sm px-6 py-4.5 no-print">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">Estudio Jurídico Digital</span>
                <h3 className="mt-1 text-md font-bold text-slate-950">
                  {generatedDoc ? 'Borrador Redactado con Precisión RAG' : selectedModel.title}
                </h3>
              </div>

              {generatedDoc ? (
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-sm backdrop-blur-sm">
                  <button onClick={() => setIsPreviewOpen(true)} className="rounded-lg bg-white border border-slate-200/50 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm">
                    <Eye size={13} className="text-slate-500" />
                    <span>Vista amplia</span>
                  </button>
                  <button onClick={handleCopy} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-950 hover:shadow-sm transition-all" title="Copiar texto">
                    <Copy size={15} />
                  </button>
                  <button onClick={handlePrint} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-950 hover:shadow-sm transition-all" title="Imprimir borrador">
                    <Printer size={15} />
                  </button>
                  <button onClick={handleDownload} className="rounded-lg p-2 text-legal-gold hover:bg-white hover:shadow-sm transition-all" title="Descargar borrador">
                    <Download size={15} />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Visualizer Body */}
            <div className="relative flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center items-start print:p-0 print:overflow-visible">
              
              {/* INTERACTIVE STEP-BY-STEP RAG SCANNER SCREEN */}
              {isDrafting ? (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/92 backdrop-blur-md text-white px-8 py-12 animate-in fade-in duration-300">
                  <div className="relative flex h-28 w-28 items-center justify-center">
                    
                    {/* Glowing gold radar effect */}
                    <div className="absolute inset-0 rounded-full border border-legal-gold/20 animate-radar" />
                    <div className="absolute inset-2 rounded-full border border-legal-gold/30 animate-pulse-soft" />
                    <div className="absolute inset-0 rounded-full border-2 border-legal-gold border-t-transparent animate-spin" />
                    
                    {/* Scanner line overlay */}
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-legal-gold to-transparent animate-scan" />
                    
                    <Scale size={32} className="text-legal-gold" />
                  </div>

                  <h4 className="mt-8 text-lg font-serif font-bold tracking-wide text-white">
                    Escaneando Base de Conocimiento
                  </h4>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-legal-gold/80">
                    Sistema RAG Integrado Lex
                  </p>

                  {/* Sequential Steps Display */}
                  <div className="mt-8 w-full max-w-[280px] space-y-4 text-left border border-white/5 bg-white/[0.02] p-5 rounded-2xl">
                    <div className={cn("flex items-center gap-3 transition-opacity duration-300", ragStep >= 1 ? "opacity-100" : "opacity-30")}>
                      {ragStep > 1 ? <CheckCircle2 size={16} className="text-legal-gold shrink-0" /> : <Layers size={16} className="text-legal-gold/80 animate-pulse shrink-0" />}
                      <span className="text-[11px] font-semibold">🧬 Vectorizando requerimientos...</span>
                    </div>

                    <div className={cn("flex items-center gap-3 transition-opacity duration-300", ragStep >= 2 ? "opacity-100" : "opacity-30")}>
                      {ragStep > 2 ? <CheckCircle2 size={16} className="text-legal-gold shrink-0" /> : <Database size={16} className="text-legal-gold/80 animate-pulse shrink-0" />}
                      <span className="text-[11px] font-semibold">🔍 Buscando en LFT y Ley del IMSS...</span>
                    </div>

                    <div className={cn("flex items-center gap-3 transition-opacity duration-300", ragStep >= 3 ? "opacity-100" : "opacity-30")}>
                      {ragStep >= 3 ? <Cpu size={16} className="text-legal-gold shrink-0 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />}
                      <span className="text-[11px] font-semibold">📥 Inyectando contexto semántico...</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Borrador Generado en Formato Papel Realista */}
              {generatedDoc ? (
                <div className="w-full max-w-[210mm] min-h-[297mm] rounded-sm border border-slate-200/80 bg-white p-[15mm] sm:p-[20mm] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden legal-document-print">
                  {/* Subtle golden header strip to match LexCorporativo style */}
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-legal-gold/60 to-transparent" />
                  
                  <div className="markdown-body prose prose-slate prose-sm max-w-none md:prose-base prose-headings:font-serif prose-headings:text-slate-950 prose-headings:border-b prose-headings:border-slate-100 prose-headings:pb-1.5 prose-p:leading-[1.85] prose-p:text-justify prose-p:text-slate-800 font-medium">
                    <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                    <div className="mt-12 pt-6 border-t border-slate-200/60 no-print">
                      <p className="text-[10px] text-slate-400 font-medium text-center italic">
                        Generado con Inteligencia Artificial por Lex Laboral. Este documento es un borrador y debe ser revisado por un profesional legal.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <WorkspaceEmpty
                    icon={<FileText size={38} className="text-slate-300 animate-pulse-soft" />}
                    title="Espacio de Previsualización"
                    description="Captura los requerimientos en el formulario de la izquierda. Tras el análisis semántico vectorizado de LFT/IMSS, aquí se renderizará tu borrador formal con tipografía legal y diseño realista de hoja de papel listo para descargar o imprimir."
                    className="min-h-[280px] border border-dashed border-slate-200 bg-white rounded-2xl p-8"
                  />

                  {/* Guidelines Box */}
                  <div className="border border-slate-200/60 bg-white/80 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-legal-gold">
                        <Sparkles size={12} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wide">Estructura del Studio RAG</h4>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 font-medium">{selectedModel.outcome}</p>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {selectedModel.previewSections.map((section) => (
                        <div key={section} className="rounded-xl border border-slate-100 bg-white p-3.5 flex flex-col justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Sección LFT</span>
                          <p className="mt-1 text-xs font-bold text-slate-950 leading-snug">{section}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WorkspacePanel>
        </div>
      </div>

      {/* Vista Amplia Modal Esmerilada */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 sm:p-6 backdrop-blur-md animate-fade-in print:bg-white print:p-0"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[#FAFAFA] shadow-[0_30px_70px_rgba(0,0,0,0.5)] print:h-auto print:max-w-full print:border-none print:shadow-none print:bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4.5 no-print">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">Vista Amplia de Edición</span>
                  <h3 className="mt-1 text-md font-bold text-slate-950">{selectedModel.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={handleCopy} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 transition-all" title="Copiar">
                    <Copy size={16} />
                  </button>
                  <button onClick={handlePrint} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 transition-all" title="Imprimir">
                    <Printer size={16} />
                  </button>
                  <button onClick={handleDownload} className="rounded-lg p-2 text-legal-gold hover:bg-slate-100 transition-all" title="Descargar">
                    <Download size={16} />
                  </button>
                  <div className="w-px h-5 bg-slate-200 mx-1.5" />
                  <button onClick={() => setIsPreviewOpen(false)} className="rounded-lg bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 p-2 transition-all" title="Cerrar">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center bg-[#FAFAFA] print:p-0 print:bg-white print:overflow-visible">
                <div className="w-full max-w-[210mm] min-h-[297mm] rounded-sm border border-slate-200/80 bg-white p-[15mm] sm:p-[20mm] shadow-lg relative overflow-hidden legal-document-print">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-legal-gold/60 to-transparent" />
                  <div className="markdown-body prose prose-slate prose-sm max-w-none md:prose-base prose-headings:font-serif prose-headings:text-slate-950 prose-headings:border-b prose-headings:border-slate-100 prose-headings:pb-1.5 prose-p:leading-[1.85] prose-p:text-justify prose-p:text-slate-800 font-medium">
                    <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                    <div className="mt-12 pt-6 border-t border-slate-200/60 no-print">
                      <p className="text-[10px] text-slate-400 font-medium text-center italic">
                        Generado con Inteligencia Artificial por Lex Laboral. Este documento es un borrador y debe ser revisado por un profesional legal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WorkspacePage>
  );
});

Drafter.displayName = 'Drafter';
