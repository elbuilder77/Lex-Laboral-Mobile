/**
 * SEO Manager — Dynamic Head Tags for SPA
 * 
 * Actualiza <title>, <meta description>, canonical, y OG tags
 * dinámicamente al navegar entre vistas en la SPA.
 * 
 * Uso: llamar updateSEO(AppView.CALCULATOR) al cambiar de vista.
 */

import { AppView } from '../types';
import { getPathForView } from './routes';

const SITE_NAME = 'Lex Laboral';
const BASE_URL = 'https://lexlaboral.com.mx';
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/og-image.png`;

interface SEOConfig {
  title: string;
  description: string;
  path: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
}

interface FaqSchemaItem {
  question: string;
  answer: string;
}

/**
 * Mapa de configuración SEO por vista.
 * Cada vista pública tiene su propio título, descripción y canonical.
 */
const SEO_MAP: Record<AppView, SEOConfig> = {
  [AppView.HOME]: {
    title: `Calculadora de Liquidación, IMSS y Documentos Laborales en México 2026 | ${SITE_NAME}`,
    description: 'Calculadora de liquidación y finiquito en México, calculadora IMSS e INFONAVIT y generador de documentos laborales con IA. Plataforma jurídica laboral para 2026.',
    path: getPathForView(AppView.HOME),
  },
  [AppView.CALCULATOR]: {
    title: `Calculadora de Liquidación y Finiquito en México 2026 | ${SITE_NAME}`,
    description: 'Calcula liquidación, finiquito, aguinaldo, vacaciones, prima de antigüedad e ISR en México. Herramienta laboral gratuita para usuarios registrados.',
    path: getPathForView(AppView.CALCULATOR),
    ogTitle: 'Calculadora de Liquidación y Finiquito en México 2026',
    ogDescription: 'Herramienta laboral para calcular liquidación y finiquito en México con desglose paso a paso.',
  },
  [AppView.DRAFTING]: {
    title: `Generador de Documentos Laborales con IA en México | ${SITE_NAME}`,
    description: 'Genera contratos laborales, convenios, cartas de renuncia y otros documentos laborales con IA. Pensado para borradores jurídicos en México.',
    path: getPathForView(AppView.DRAFTING),
    ogTitle: 'Generador de Documentos Laborales con IA en México',
    ogDescription: 'Crea contratos, convenios y otros borradores laborales en México con inteligencia artificial.',
  },
  [AppView.SOCIAL_SECURITY]: {
    title: `Calculadora de Cuotas IMSS e INFONAVIT en México 2026 | ${SITE_NAME}`,
    description: 'Calcula cuotas obrero-patronales IMSS e INFONAVIT con desglose por ramo de seguro, cesantía y prima de riesgo. Herramienta de apoyo para México.',
    path: getPathForView(AppView.SOCIAL_SECURITY),
    ogTitle: 'Calculadora de Cuotas IMSS e INFONAVIT en México 2026',
    ogDescription: 'Desglose completo de cuotas de seguridad social para patrones y trabajadores en México.',
  },
  [AppView.PENSION_CALCULATOR]: {
    title: `Calculadora de Pensiones IMSS en México | ${SITE_NAME}`,
    description: 'Calcula tu pensión del IMSS bajo el Régimen 1973 y Régimen 1997. Estima tu monto mensual de pensión de forma rápida y gratuita.',
    path: getPathForView(AppView.PENSION_CALCULATOR),
    ogTitle: 'Calculadora de Pensiones IMSS en México (Ley 73 y 97)',
    ogDescription: 'Calcula la estimación de tu pensión del IMSS basada en tus semanas cotizadas y salario o saldo de AFORE.',
  },
  [AppView.CEO_DASHBOARD]: {
    title: `Panel de Administración | ${SITE_NAME}`,
    description: 'Panel de control y métricas de Lex Laboral.',
    path: getPathForView(AppView.CEO_DASHBOARD),
    robots: 'noindex, nofollow, noarchive',
  },
  [AppView.TERMS]: {
    title: `Términos y Condiciones | ${SITE_NAME}`,
    description: 'Términos y condiciones de uso de la plataforma Lex Laboral. Conoce tus derechos y obligaciones como usuario.',
    path: getPathForView(AppView.TERMS),
  },
  [AppView.PRIVACY]: {
    title: `Aviso de Privacidad | ${SITE_NAME}`,
    description: 'Aviso de privacidad y protección de datos personales de Lex Laboral conforme a la LFPDPPP.',
    path: getPathForView(AppView.PRIVACY),
  },
};

/**
 * Actualiza o crea un <meta> tag en el <head>.
 */
function setMeta(attribute: string, key: string, value: string): void {
  let el = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (el) {
    el.setAttribute('content', value);
  } else {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    el.setAttribute('content', value);
    document.head.appendChild(el);
  }
}

/**
 * Actualiza o crea el <link rel="canonical">.
 */
function setCanonical(url: string): void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (el) {
    el.href = url;
  } else {
    el = document.createElement('link');
    el.rel = 'canonical';
    el.href = url;
    document.head.appendChild(el);
  }
}

function upsertJsonLd(id: string, data: Record<string, unknown>): void {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }

  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string): void {
  const el = document.getElementById(id);
  if (el) {
    el.remove();
  }
}

function buildFaqSchema(url: string, faqs: FaqSchemaItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
    url,
  };
}

function buildSchemas(view: AppView, fullUrl: string, title: string, description: string) {
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: fullUrl,
    inLanguage: 'es-MX',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };

  const breadcrumbMap: Record<AppView, string[]> = {
    [AppView.HOME]: ['Inicio'],
    [AppView.CALCULATOR]: ['Inicio', 'Calculadora de Liquidación'],
    [AppView.DRAFTING]: ['Inicio', 'Generador de Documentos'],
    [AppView.SOCIAL_SECURITY]: ['Inicio', 'Calculadora IMSS'],
    [AppView.PENSION_CALCULATOR]: ['Inicio', 'Calculadora de Pensiones'],
    [AppView.CEO_DASHBOARD]: ['Inicio', 'Panel CEO'],
    [AppView.TERMS]: ['Inicio', 'Términos'],
    [AppView.PRIVACY]: ['Inicio', 'Privacidad'],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbMap[view].map((label, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: label,
      item: index === 0 ? BASE_URL : fullUrl,
    })),
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: fullUrl,
    description,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MXN',
      price: view === AppView.CALCULATOR || view === AppView.HOME || view === AppView.PENSION_CALCULATOR ? '0' : '0',
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
    inLanguage: 'es-MX',
  };

  const schemas: Record<string, Record<string, unknown>> = {
    page: pageSchema,
    breadcrumb: breadcrumbSchema,
    software: softwareSchema,
  };

  if (view === AppView.HOME) {
    schemas.organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
      logo: `${BASE_URL}/assets/logo.png`,
      areaServed: 'MX',
      email: 'admin@lexlaboral.com.mx',
    };
  }

  const faqByView: Partial<Record<AppView, FaqSchemaItem[]>> = {
    [AppView.HOME]: [
      {
        question: 'Que herramientas ofrece Lex Laboral?',
        answer: 'Lex Laboral ofrece una calculadora de prestaciones laborales, una calculadora IMSS e INFONAVIT y un generador de documentos laborales con IA.',
      },
      {
        question: 'Que parte de la plataforma es gratis?',
        answer: 'La calculadora laboral está disponible para usuarios registrados sin costo. La calculadora IMSS y el generador documental dependen del plan activo o del documento suelto.',
      },
    ],
    [AppView.CALCULATOR]: [
      {
        question: 'Como calcular una liquidacion en Mexico?',
        answer: 'Generalmente debes considerar indemnización constitucional, 20 días por año cuando proceda, prima de antigüedad y prestaciones proporcionales como aguinaldo, vacaciones y prima vacacional.',
      },
      {
        question: 'La calculadora de liquidacion es gratis?',
        answer: 'Sí, la calculadora de prestaciones está disponible para usuarios registrados.',
      },
    ],
    [AppView.DRAFTING]: [
      {
        question: 'Que documentos laborales puede generar la herramienta?',
        answer: 'Puede ayudarte a elaborar borradores de contratos, convenios, cartas de renuncia, actas administrativas, reglamentos y otros escritos laborales frecuentes.',
      },
      {
        question: 'Se puede usar sin suscripcion?',
        answer: 'Sí, mediante la compra de un documento suelto. También puede usarse con plan mensual o trimestral activo.',
      },
    ],
    [AppView.SOCIAL_SECURITY]: [
      {
        question: 'Que calcula la calculadora IMSS?',
        answer: 'Calcula cuotas obrero-patronales IMSS e INFONAVIT con desglose por ramo y apoyo para revisar la prima de riesgo.',
      },
      {
        question: 'La calculadora IMSS es gratuita?',
        answer: 'No, está disponible para usuarios con plan mensual o trimestral activo.',
      },
    ],
    [AppView.PENSION_CALCULATOR]: [
      {
        question: '¿Qué ley de IMSS utiliza esta calculadora de pensiones?',
        answer: 'Soporta cálculos estimados tanto para la Ley del Seguro Social de 1973 (basada en salario promedio y semanas cotizadas) como para la Ley de 1997 (basada en el saldo de la AFORE).',
      },
      {
        question: '¿Es exacta la calculadora de pensiones?',
        answer: 'Los resultados son estimaciones basadas en las fórmulas generales de la Ley del Seguro Social. Para obtener tu resolución definitiva debes acudir al IMSS.',
      },
    ],
  };

  const faqs = faqByView[view];
  if (faqs?.length) {
    schemas.faq = buildFaqSchema(fullUrl, faqs);
  }

  return schemas;
}

/**
 * Actualiza todos los tags SEO del <head> para la vista dada.
 * Llamar al cambiar de vista en la aplicación.
 */
export function updateSEO(view: AppView): void {
  const config = SEO_MAP[view];
  if (!config) return;

  const fullUrl = `${BASE_URL}${config.path}`;
  const ogTitle = config.ogTitle || config.title;
  const ogDescription = config.ogDescription || config.description;

  // Title
  document.title = config.title;

  // Standard meta
  setMeta('name', 'description', config.description);
  setMeta('name', 'robots', config.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Canonical
  setCanonical(fullUrl);

  // Open Graph
  setMeta('property', 'og:title', ogTitle);
  setMeta('property', 'og:description', ogDescription);
  setMeta('property', 'og:url', fullUrl);
  setMeta('property', 'og:image', DEFAULT_OG_IMAGE);
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:locale', 'es_MX');

  // Twitter
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', ogTitle);
  setMeta('name', 'twitter:description', ogDescription);
  setMeta('name', 'twitter:url', fullUrl);
  setMeta('name', 'twitter:image', DEFAULT_OG_IMAGE);

  const schemas = buildSchemas(view, fullUrl, config.title, config.description);
  upsertJsonLd('seo-schema-page', schemas.page);
  upsertJsonLd('seo-schema-breadcrumb', schemas.breadcrumb);
  upsertJsonLd('seo-schema-software', schemas.software);

  if (schemas.organization) {
    upsertJsonLd('seo-schema-organization', schemas.organization);
  } else {
    removeJsonLd('seo-schema-organization');
  }

  if (schemas.faq) {
    upsertJsonLd('seo-schema-faq', schemas.faq);
  } else {
    removeJsonLd('seo-schema-faq');
  }
}

/**
 * Retorna la configuración SEO para una vista (útil para SSR futuro).
 */
export function getSEOConfig(view: AppView): SEOConfig {
  return SEO_MAP[view] || SEO_MAP[AppView.HOME];
}
