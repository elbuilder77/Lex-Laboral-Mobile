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
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed text-[15px]">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">01</span>
            Aceptación y Titularidad
          </h2>
          <p>Bienvenido a <strong>Lex Laboral</strong>. Al acceder y utilizar esta aplicación móvil y sus servicios asociados, usted acepta estar sujeto a estos Términos y Condiciones. La plataforma es propiedad de y está operada por <strong>filex dev</strong> (en lo sucesivo, "el Titular"), con domicilio en Mérida, Yucatán, México.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">02</span>
            Naturaleza de los Servicios
          </h2>
          <div className="space-y-4">
            <p><strong>2.1. Alcance:</strong> La aplicación móvil Lex Laboral ofrece calculadoras informativas de prestaciones laborales, cuotas IMSS e INFONAVIT y estimaciones de pensión.</p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm my-6">
              <p className="text-amber-900 font-bold mb-2 flex items-center gap-2 italic uppercase tracking-wider text-xs">
                ⚠️ DESLINDE DE RESPONSABILIDAD CRÍTICO
              </p>
              <p className="text-sm leading-6"><strong>LA APLICACIÓN NO CONSTITUYE ASESORÍA LEGAL PROFESIONAL.</strong> Los resultados son estimaciones y deben ser revisados por un profesional antes de usarse para decisiones legales o económicas.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">03</span>
            Servicio Gratuito y Sin Cuenta
          </h2>
          <p>Lex Laboral es una herramienta <strong>completamente gratuita</strong>. No se requiere cuenta, suscripción ni pago para utilizar sus tres calculadoras.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-legal-gold flex items-center justify-center text-xs font-bold">04</span>
            Propiedad Intelectual
          </h2>
          <p>Todos los derechos sobre el software, código, diseño, logotipos y marcas pertenecen a <strong>filex dev</strong>. El Usuario recibe una licencia limitada de uso personal o profesional, sin derecho a revender la tecnología.</p>
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
            <li><strong>Técnica:</strong> Datos de uso anónimos y agregados para mejorar la aplicación. La aplicación no requiere registro ni recopila datos personales de identificación.</li>
            <li><strong>Cálculos:</strong> Los datos introducidos para realizar cálculos permanecen en el dispositivo durante el uso de la aplicación.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Finalidades del Tratamiento</h2>
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Primarias:</strong> Prestación de los servicios de cálculo laboral, seguridad social y estimación de pensiones.</li>
            <li><strong>Secundarias:</strong> Mejora de la experiencia de usuario mediante métricas de uso anónimas.</li>
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
          <span className="text-sm font-bold uppercase tracking-wider">Volver a Inicio</span>
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
