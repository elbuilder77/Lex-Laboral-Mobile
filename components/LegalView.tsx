import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Scale, FileText, Lock } from 'lucide-react';
import { AppView } from '../types';

interface LegalViewProps {
  type: AppView.TERMS | AppView.PRIVACY;
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ type, onBack }) => {
  const isTerms = type === AppView.TERMS;

  const content = isTerms ? (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-900 text-legal-gold rounded-2xl shadow-lg border border-white/10">
          <Scale size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight">Términos y Condiciones</h1>
          <p className="text-slate-500 text-sm font-medium">Última actualización: 29 de marzo de 2026</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-[15px]">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">01</span>
            Aceptación y Titularidad
          </h2>
          <p>Bienvenido a <strong>Lex Laboral</strong>. Al acceder y utilizar este sitio web y sus servicios asociados, usted acepta estar sujeto a estos Términos y Condiciones. La plataforma es propiedad de y está operada por <strong>filex dev</strong> (en lo sucesivo, "el Titular"), con domicilio en Mérida, Yucatán, México.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">02</span>
            Naturaleza de los Servicios (LegalTech & IA)
          </h2>
          <div className="space-y-4">
            <p><strong>2.1. Alcance:</strong> Lex Laboral es una herramienta de asistencia jurídica basada en inteligencia artificial (Google Gemini API). Provee cálculos de prestaciones laborales en México (LFT, IMSS) y redacción automatizada de borradores legales.</p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm my-6">
              <p className="text-amber-900 font-bold mb-2 flex items-center gap-2 italic uppercase tracking-wider text-xs">
                ⚠️ DESLINDE DE RESPONSABILIDAD CRÍTICO
              </p>
              <p className="text-sm leading-6"><strong>LA PLATAFORMA NO CONSTITUYE ASESORÍA LEGAL PROFESIONAL.</strong> El contenido es generado mediante algoritmos de IA y debe ser revisado por un abogado titulado antes de su uso oficial. filex dev no se hace responsable por errores en los cálculos o documentos que resulten en perjuicios legales o económicos para el Usuario.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">03</span>
            Pagos y Suscripciones (Stripe)
          </h2>
          <p>Los pagos se procesan exclusivamente a través de la pasarela segura <strong>Stripe</strong>. Al realizar una compra, usted acepta los términos de uso de Stripe. Las suscripciones ("Pase Mensual" o "Trimestral") se cobran por adelantado y no son reembolsables, salvo disposición legal obligatoria en México.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">04</span>
            Propiedad Intelectual
          </h2>
          <p>Todos los derechos sobre el software, código, diseño, logotipos y marcas pertenecen a <strong>filex dev</strong>. El Usuario tiene una licencia de uso limitada para generar y descargar documentos para fines personales o profesionales propios, sin derecho a revender la tecnología de la plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">05</span>
            Jurisdicción y Ley Aplicable
          </h2>
          <p>Para la interpretación y cumplimiento de estos términos, las partes se someten expresamente a las leyes vigentes de los Estados Unidos Mexicanos y a la jurisdicción de los tribunales competentes en la ciudad de <strong>Mérida, Yucatán</strong>, renunciando a cualquier otro fuero que pudiere corresponderles por razón de sus domicilios presentes o futuros.</p>
        </section>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg border border-white/10">
          <Shield size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight">Aviso de Privacidad</h1>
          <p className="text-slate-500 text-sm font-medium">Integral • Ley Federal de Protección de Datos Personales</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-[15px]">
        <section className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-emerald-900 mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
             Identidad del Responsable
          </h2>
          <p className="text-sm"><strong>filex dev</strong>, con domicilio en Mérida, Yucatán, es el responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Correo de contacto: <strong>admin@lexlaboral.com.mx</strong>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Datos Personales Tratados</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Identificación:</strong> Nombre o alias para la personalización de documentos.</li>
            <li><strong>Contacto:</strong> Correo electrónico para el envío de comprobantes de pago y acceso a la plataforma.</li>
            <li><strong>Información Técnica:</strong> Los documentos que usted sube para análisis son procesados de forma efímera para generar el resultado mediante IA.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Finalidades del Tratamiento</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Primarias:</strong> Prestación del servicio de cálculo laboral, generación de borradores jurídicos y procesamiento de pagos vía Stripe.</li>
            <li><strong>Secundarias:</strong> Mejora de la experiencia de usuario y envío ocasional de actualizaciones del sistema (previo consentimiento).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Transferencias de Datos</h2>
          <p>Le informamos que sus datos personales pueden ser compartidos con terceros únicamente para los fines del servicio:</p>
          <ul className="list-disc pl-6 space-y-3 mt-4">
            <li><strong>Google LLC (Gemini API):</strong> Procesa el contenido para generar el análisis inteligente.</li>
            <li><strong>Stripe Inc:</strong> Procesa la información financiera de forma cifrada (filex dev no almacena números de tarjeta).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Derechos ARCO</h2>
          <p>Usted tiene derecho a conocer qué datos tenemos (Acceso), corregirlos (Rectificación), eliminarlos de nuestras bases (Cancelación) u oponerse al uso de los mismos para fines específicos (Oposición). Para ejercer estos derechos, envíe un correo a <strong>admin@lexlaboral.com.mx</strong>.</p>
        </section>
      </div>
    </>
  );

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-10 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Regresar al Ecosistema</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100"
        >
          {content}
          
          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Lex Laboral • Sistema de Protección de Datos y Cumplimiento Normativo
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
