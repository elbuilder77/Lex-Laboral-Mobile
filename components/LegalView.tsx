import React from 'react';
import { Capacitor } from '@capacitor/core';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Scale, FileText, Lock } from 'lucide-react';
import { AppView } from '../types';

interface LegalViewProps {
  type: AppView.TERMS | AppView.PRIVACY;
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ type, onBack }) => {
  const isTerms = type === AppView.TERMS;
  const isNativeMobile = Capacitor.isNativePlatform();

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
            {isNativeMobile ? 'Naturaleza de los Servicios' : 'Naturaleza de los Servicios (LegalTech & IA)'}
          </h2>
          <div className="space-y-4">
            <p><strong>2.1. Alcance:</strong> {isNativeMobile ? 'Lex Laboral es una herramienta informativa para realizar cálculos laborales en México, incluyendo estimaciones de prestaciones conforme a la LFT, cuotas IMSS e INFONAVIT y proyecciones de pensión.' : 'Lex Laboral es una herramienta de asistencia jurídica basada en inteligencia artificial (Google Gemini API). Provee cálculos de prestaciones laborales en México (LFT, IMSS) y redacción automatizada de borradores legales.'}</p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm my-6">
              <p className="text-amber-900 font-bold mb-2 flex items-center gap-2 italic uppercase tracking-wider text-xs">
                ⚠️ DESLINDE DE RESPONSABILIDAD CRÍTICO
              </p>
              <p className="text-sm leading-6"><strong>LA PLATAFORMA NO CONSTITUYE ASESORÍA LEGAL PROFESIONAL.</strong> {isNativeMobile ? 'Los resultados son estimaciones informativas y deben ser revisados por un profesional competente antes de tomar decisiones legales, laborales o financieras. filex dev no se hace responsable por errores en los cálculos que resulten en perjuicios legales o económicos para el Usuario.' : 'El contenido es generado mediante algoritmos de IA y debe ser revisado por un abogado titulado antes de su uso oficial. filex dev no se hace responsable por errores en los cálculos o documentos que resulten en perjuicios legales o económicos para el Usuario.'}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">03</span>
            Servicio Gratuito y Sin Cuenta
          </h2>
          <p>Lex Laboral es una herramienta <strong>completamente gratuita</strong>. No se requiere creación de cuenta, suscripción ni ningún tipo de pago para acceder a cualquiera de sus funcionalidades, incluidas {isNativeMobile ? 'las calculadoras laborales, la calculadora IMSS e INFONAVIT, la calculadora de pensiones y la exportación de resultados a PDF.' : 'las calculadoras laborales, la calculadora IMSS e INFONAVIT, la calculadora de pensiones y el generador de documentos con IA.'}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">04</span>
            Propiedad Intelectual
          </h2>
          <p>Todos los derechos sobre el software, código, diseño, logotipos y marcas pertenecen a <strong>filex dev</strong>. El Usuario tiene una licencia de uso limitada {isNativeMobile ? 'para generar cálculos y descargar resultados para fines personales o profesionales propios' : 'para generar y descargar documentos para fines personales o profesionales propios'}, sin derecho a revender la tecnología de la plataforma.</p>
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
            <li><strong>Técnica:</strong> {isNativeMobile ? 'La aplicación no requiere registro, no usa cuentas y no recopila datos personales de identificación para operar las calculadoras.' : 'Datos de uso anónimos y agregados para mejorar la aplicación. La aplicación no requiere registro ni recopila datos personales de identificación.'}</li>
            <li><strong>Documentos:</strong> {isNativeMobile ? 'Los resultados que usted genera se almacenan localmente en su dispositivo cuando la aplicación necesita conservar el último cálculo realizado.' : 'Los documentos que usted genera se procesan de forma efímera para producir el resultado mediante IA y se almacenan únicamente en su dispositivo.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Finalidades del Tratamiento</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Primarias:</strong> {isNativeMobile ? 'Prestación del servicio de cálculo laboral, cálculo de cuotas IMSS e INFONAVIT, cálculo de pensión y exportación de resultados a PDF.' : 'Prestación del servicio de cálculo laboral y generación de borradores jurídicos mediante IA.'}</li>
            <li><strong>Secundarias:</strong> {isNativeMobile ? 'En esta versión no se usan cuentas, publicidad, pagos, suscripciones ni analítica invasiva.' : 'Mejora de la experiencia de usuario mediante métricas de uso anónimas.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Transferencias de Datos</h2>
          <p>{isNativeMobile ? 'En esta versión móvil, Lex Laboral no comparte datos personales con terceros para operar las calculadoras incluidas.' : 'Le informamos que sus datos pueden ser compartidos con Google LLC (Gemini API) únicamente para procesar el contenido y generar el análisis inteligente.'}</p>
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
          <span className="text-sm font-bold uppercase tracking-wider">{isNativeMobile ? 'Regresar' : 'Regresar al Ecosistema'}</span>
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
