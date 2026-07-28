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
import { draftLegalDocument } from '../services/gemini';
import { NotificationType, DraftingState } from '../types';
import { useAuth } from './AuthProvider';
import { WorkspaceEmpty, WorkspaceHeader, WorkspacePage, WorkspacePanel } from './ui/Workspace';
import { cn } from '../lib/cn';
import { motion, AnimatePresence } from 'framer-motion';

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

const DraftContent = ({ content, plainText }: { content: string; plainText?: boolean }) => {
  if (plainText) {
    return (
      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-[1.85] text-slate-800">
        {content}
      </pre>
    );
  }

  return <ReactMarkdown>{content}</ReactMarkdown>;
};

export const Drafter = React.memo<DrafterProps>(({ state, setState, notify, onUpgrade, onAuthRequired }) => {
  const { prompt, generatedDoc } = state;
  const visualizerRef = React.useRef<HTMLDivElement>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { user, access, refreshAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form');

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
    const timeoutId = window.setTimeout(() => {
      localStorage.setItem('draft_template', selectedTemplate);
      localStorage.setItem('draft_employeeName', employeeName);
      localStorage.setItem('draft_position', position);
      localStorage.setItem('draft_details', details);
      localStorage.setItem('draft_customInstructions', customInstructions);
      localStorage.setItem('draft_fieldValues', JSON.stringify(fieldValues));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [selectedTemplate, employeeName, position, details, customInstructions, fieldValues]);

  const [ragStep, setRagStep] = useState(1);

  const selectedModel = useMemo(
    () => DRAFTING_MODELS.find((model) => model.id === selectedTemplate) || DRAFTING_MODELS[0],
    [selectedTemplate]
  );

  const accessCopy = access.hasActiveSubscription
    ? 'Premium activo. Borradores ilimitados.'
    : access.singleDocumentUsesRemaining > 0
      ? `Tienes ${access.singleDocumentUsesRemaining} saldo${access.singleDocumentUsesRemaining === 1 ? '' : 's'} disponible${access.singleDocumentUsesRemaining === 1 ? '' : 's'}.`
      : 'Requiere saldo o plan mensual.';

  useEffect(() => {
    let assembledPrompt = selectedModel.basePrompt;

    if (employeeName.trim()) assembledPrompt += `\nNombre principal (persona/empresa): ${employeeName.trim()}`;
    if (position.trim()) assembledPrompt += `\nPuesto o relación: ${position.trim()}`;

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

    setActiveTab('results');
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
      localStorage.removeItem('draft_details');
      localStorage.removeItem('draft_customInstructions');
      setGeneratedDoc(document);
      notify('Borrador generado con referencias LFT/IMSS', 'success', 'Listo');
    } catch (error: any) {
      console.error('Drafting Error:', error);
      notify(error?.message || 'Error al contactar con la API de Gemini.', 'error');
      setActiveTab('form');
    } finally {
      setIsDrafting(false);
    }
  }, [access, customInstructions, notify, onAuthRequired, onUpgrade, prompt, refreshAccess, setGeneratedDoc, user]);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-slate-950 px-6 pt-12 pb-6 shadow-md rounded-b-[2rem]">
        <h1 className="text-2xl font-serif font-bold text-white">Generador de Documentos</h1>
        <p className="text-sm text-slate-400 mt-1">Redacta con IA fundamentada en la LFT</p>
        
        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-full p-1 mt-6 border border-slate-800">
          <button 
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'form' ? 'bg-legal-gold text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Formulario
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`flex-1 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === 'results' ? 'bg-legal-gold text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Borrador
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto">
        {(!access.hasActiveSubscription && access.singleDocumentUsesRemaining <= 0) && (
          <div className="bg-slate-900 rounded-[1.5rem] p-5 shadow-lg border border-legal-gold/20 mb-4">
            <h4 className="text-legal-gold text-sm font-bold flex items-center gap-2 uppercase tracking-widest"><ShieldAlert size={16}/> Acceso Restringido</h4>
            <p className="text-slate-300 text-xs mt-2 leading-relaxed">
              No cuentas con saldo para generar documentos.
            </p>
            <button
              onClick={() => onUpgrade?.('draft_basic')}
              className="mt-4 w-full bg-legal-gold text-slate-950 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
            >
              Comprar Saldo
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Plantilla Legal</label>
                <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                  {DRAFTING_MODELS.map((model) => {
                    const isActive = selectedTemplate === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedTemplate(model.id)}
                        className={cn(
                          'flex-none w-[140px] rounded-[1.2rem] p-4 text-left transition-all',
                          isActive
                            ? 'bg-slate-950 text-white shadow-md'
                            : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-3', isActive ? 'bg-white/10 text-legal-gold' : 'bg-slate-200/50 text-slate-400')}>
                          {model.icon}
                        </div>
                        <h3 className="text-xs font-bold leading-tight">{model.title}</h3>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Persona / Empresa</label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Ej. Juan Pérez / Empresa S.A."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Puesto / Relación</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Ej. Gerente de Ventas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none"
                  />
                </div>
              </div>

              {selectedModel.fields && selectedModel.fields.length > 0 && (
                <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-legal-gold block mb-2">Variables del formato</span>
                  {selectedModel.fields.map((field) => {
                    const value = fieldValues[field.id] || '';
                    return (
                      <div key={field.id} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={value}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full min-h-[80px] resize-none bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={value}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 font-bold focus:border-legal-gold outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Hechos Adicionales (Opcional)</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={selectedModel.detailsPlaceholder}
                    className="w-full min-h-[100px] resize-none bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 font-medium focus:border-legal-gold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Instrucciones para la IA (Opcional)</label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Ej. Tono formal, incluir cláusula de confidencialidad"
                    className="w-full min-h-[80px] resize-none bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-900 font-medium focus:border-legal-gold outline-none"
                  />
                </div>
              </div>

              <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-0 w-full px-4 z-40 md:relative md:bottom-auto md:px-0 mt-6 flex gap-2 items-center">
                <div className="bg-white rounded-full px-4 py-3 shadow-md flex-1 overflow-hidden">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Saldo</span>
                  <span className="text-[11px] font-bold text-slate-900 truncate block">{accessCopy}</span>
                </div>
                <button
                  onClick={handleDraft}
                  disabled={isDrafting || !prompt.trim()}
                  className="bg-slate-950 text-legal-gold h-12 w-12 rounded-full shadow-lg flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
              ref={visualizerRef}
            >
              {isDrafting ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900 rounded-[1.5rem] border border-slate-800 text-white">
                  <div className="relative flex h-24 w-24 items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full border border-legal-gold/20 animate-radar" />
                    <div className="absolute inset-0 rounded-full border-2 border-legal-gold border-t-transparent animate-spin" />
                    <Scale size={28} className="text-legal-gold" />
                  </div>
                  <h4 className="text-lg font-serif font-bold text-white mb-2">Generando...</h4>
                  <div className="space-y-2 text-left">
                    <div className={cn("flex items-center gap-2 transition-opacity duration-300", ragStep >= 1 ? "opacity-100" : "opacity-30")}>
                      <CheckCircle2 size={12} className={ragStep > 1 ? "text-legal-gold" : "text-legal-gold/50"} />
                      <span className="text-[10px] font-medium text-slate-300">Vectorizando requerimientos</span>
                    </div>
                    <div className={cn("flex items-center gap-2 transition-opacity duration-300", ragStep >= 2 ? "opacity-100" : "opacity-30")}>
                      <CheckCircle2 size={12} className={ragStep > 2 ? "text-legal-gold" : "text-legal-gold/50"} />
                      <span className="text-[10px] font-medium text-slate-300">Consultando LFT / IMSS</span>
                    </div>
                    <div className={cn("flex items-center gap-2 transition-opacity duration-300", ragStep >= 3 ? "opacity-100" : "opacity-30")}>
                      <CheckCircle2 size={12} className={ragStep >= 3 ? "text-legal-gold" : "text-legal-gold/50"} />
                      <span className="text-[10px] font-medium text-slate-300">Redactando borrador</span>
                    </div>
                  </div>
                </div>
              ) : generatedDoc ? (
                <>
                  <div className="flex gap-2 justify-end no-print">
                    <button onClick={handleCopy} className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 text-slate-600 hover:text-slate-900 active:scale-95"><Copy size={16} /></button>
                    <button onClick={handleDownload} className="rounded-xl bg-slate-950 p-3 shadow-sm border border-slate-800 text-legal-gold active:scale-95"><Download size={16} /></button>
                  </div>
                  <div className="w-full rounded-sm border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden text-sm markdown-body prose prose-slate">
                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-legal-gold/60 to-transparent" />
                    <DraftContent content={generatedDoc} />
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-[1.5rem] border border-slate-100">
                  <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-serif font-bold text-xl text-slate-900">Vista de Documento</h3>
                  <p className="text-sm text-slate-500 mt-2 px-6">Llena el formulario y oprime el botón de generar para ver tu borrador aquí.</p>
                  <button onClick={() => setActiveTab('form')} className="mt-6 px-6 py-3 bg-slate-950 text-white rounded-full text-xs font-bold uppercase tracking-widest">Ir al Formulario</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

Drafter.displayName = 'Drafter';
