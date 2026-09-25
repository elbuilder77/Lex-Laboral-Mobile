export interface GovernmentSource {
  id: string;
  name: string;
  institution: string;
  category: 'labor' | 'social_security' | 'pension' | 'general';
  description: string;
  url: string;
}

export const GOVERNMENT_SOURCES: GovernmentSource[] = [
  {
    id: 'lft',
    name: 'Ley Federal del Trabajo (LFT)',
    institution: 'H. Cámara de Diputados del H. Congreso de la Unión',
    category: 'labor',
    description: 'Texto vigente de la Ley Federal del Trabajo que regula las relaciones laborales, indemnizaciones por despido (Arts. 48 y 50), aguinaldo (Art. 87), vacaciones (Art. 76) y prima de antigüedad (Art. 162).',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf',
  },
  {
    id: 'conasami',
    name: 'Tabla de Salarios Mínimos Generales y Profesionales',
    institution: 'Comisión Nacional de los Salarios Mínimos (CONASAMI) / Gobierno de México',
    category: 'labor',
    description: 'Tabulador oficial de salarios mínimos vigentes por zona geográfica en México (Zona Libre de la Frontera Norte y Resto del País).',
    url: 'https://www.gob.mx/conasami',
  },
  {
    id: 'lss',
    name: 'Ley del Seguro Social (LSS)',
    institution: 'H. Cámara de Diputados del H. Congreso de la Unión',
    category: 'social_security',
    description: 'Marco normativo que establece los regímenes de aseguramiento, ramas de cuotas obrero-patronales y esquemas de pensiones del IMSS.',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LSS.pdf',
  },
  {
    id: 'imss-portal',
    name: 'Instituto Mexicano del Seguro Social (IMSS) - Portal Oficial',
    institution: 'IMSS / Gobierno de México',
    category: 'social_security',
    description: 'Portal oficial del IMSS para consulta de semanas cotizadas, trámites patronales, afiliación y servicios digitales.',
    url: 'https://www.imss.gob.mx/',
  },
  {
    id: 'linfonavit',
    name: 'Ley del Instituto del Fondo Nacional de la Vivienda para los Trabajadores',
    institution: 'H. Cámara de Diputados del H. Congreso de la Unión',
    category: 'social_security',
    description: 'Normativa federal que regula la aportación patronal obligatoria del 5% sobre el SBC destinada al fondo de vivienda.',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LINFONAVIT.pdf',
  },
  {
    id: 'infonavit-portal',
    name: 'INFONAVIT - Portal Oficial',
    institution: 'INFONAVIT / Gobierno de México',
    category: 'social_security',
    description: 'Portal del INFONAVIT para trámites de crédito de vivienda, subcuenta de vivienda y aportaciones obrero-patronales.',
    url: 'https://portalmx.infonavit.org.mx/',
  },
  {
    id: 'imss-pensiones',
    name: 'Tu Pensión Digital IMSS - Portal Oficial',
    institution: 'IMSS / Gobierno de México',
    category: 'pension',
    description: 'Plataforma oficial del IMSS con información sobre requisitos, trámites y resoluciones para pensiones bajo Régimen 1973 y Régimen 1997.',
    url: 'https://www.imss.gob.mx/pensiones',
  },
  {
    id: 'consar',
    name: 'Comisión Nacional del Sistema de Ahorro para el Retiro (CONSAR)',
    institution: 'CONSAR / Gobierno de México',
    category: 'pension',
    description: 'Órgano desconcentrado de la SHCP que regula y supervisa el Sistema de Ahorro para el Retiro (SAR) y las AFOREs.',
    url: 'https://www.gob.mx/consar',
  },
  {
    id: 'inegi-uma',
    name: 'Unidad de Medida y Actualización (UMA)',
    institution: 'Instituto Nacional de Estadística y Geografía (INEGI)',
    category: 'general',
    description: 'Valor diario, mensual y anual de la UMA utilizado como referencia económica oficial para topes y exenciones legales.',
    url: 'https://www.inegi.org.mx/temas/uma/',
  },
  {
    id: 'gob-mx',
    name: 'Portal Único del Gobierno de México (gob.mx)',
    institution: 'Gobierno de México',
    category: 'general',
    description: 'Punto de acceso general a todos los trámites, dependencias y legislación oficial de los Estados Unidos Mexicanos.',
    url: 'https://www.gob.mx/',
  },
];

export const OFFICIAL_DISCLAIMER = {
  title: 'Deslinde de Responsabilidad y No Representación Gubernamental',
  short: 'Esta app es de iniciativa privada e independiente. NO representa ni está afiliada al IMSS, INFONAVIT ni a ninguna entidad del Gobierno de México.',
  badge: 'Herramienta Privada e Independiente · No Oficial',
  full: 'Lex Laboral es una herramienta de cálculo de iniciativa privada e independiente y NO representa ni tiene afiliación, autorización, mandato o patrocinio del Instituto Mexicano del Seguro Social (IMSS), el Instituto del Fondo Nacional de la Vivienda para los Trabajadores (INFONAVIT), la Secretaría del Trabajo y Previsión Social (STPS), el Servicio de Administración Tributaria (SAT) ni de ninguna entidad u organismo del Gobierno de México. Las cifras, proyecciones y desgloses que genera son estimaciones informativas y didácticas basadas en leyes y normativas públicas de los Estados Unidos Mexicanos; no constituyen resoluciones oficiales, dictámenes jurídicos vinculantes ni sustituyen la asesoría legal, laboral o contable de un profesional certificado.',
};
