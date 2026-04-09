/**
 * Middleware de Seguridad para API Routes
 * 
 * ¿Qué es esto?
 * Funciones de seguridad que protegen tus endpoints de:
 * 1. Requests de orígenes no autorizados (alguien tratando de usar tu API desde otro sitio)
 * 2. Inputs maliciosos (inyección de código, prompts gigantes)
 * 3. Requests sin headers válidos
 * 
 * ¿Cuándo se usa?
 * Se llama al inicio de cada API route, antes de procesar el request.
 */

/** Dominios permitidos para hacer requests a tu API */
const ALLOWED_ORIGINS = [
  'https://lexlaboral.com.mx',
  'https://www.lexlaboral.com.mx',
  'https://lexmexl.vercel.app',
  'https://lex-laboral.vercel.app',
];

// En desarrollo, permitir localhost
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:3000');
}

// Añadir CLIENT_URL de variables de entorno si existe
if (process.env.CLIENT_URL) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_URL);
}

/**
 * Configura los headers CORS en la respuesta.
 * CORS = Cross-Origin Resource Sharing.
 * Básicamente le dice al navegador: "estos dominios sí pueden hablar con mi API".
 */
export function setCorsHeaders(req: any, res: any): void {
  const origin = req.headers.origin || '';
  
  if (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight 24h
}

/**
 * Maneja requests OPTIONS (preflight CORS).
 * El navegador envía un OPTIONS antes de un POST para verificar permisos.
 * Retorna `true` si era un preflight y ya se manejó.
 */
export function handlePreflight(req: any, res: any): boolean {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Valida que el request venga de un origen permitido.
 * En producción, bloquea requests que no vengan de tu dominio.
 * Retorna `true` si el request fue bloqueado.
 */
export function validateOrigin(req: any, res: any): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  
  const isValidOrigin = ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed) || referer.startsWith(allowed)
  );
  
  if (!isValidOrigin && origin && !origin.includes('localhost')) {
    console.warn(`[Security] Blocked unauthorized origin: ${origin}`);
    res.status(403).json({ error: 'Acceso no autorizado desde este dominio.' });
    return true; // blocked
  }
  
  return false; // allowed
}

/**
 * Sanitiza y valida el input de texto del usuario.
 * Protege contra prompts gigantes que podrían costar mucho en la API de Gemini.
 * 
 * @param text - El texto a validar
 * @param maxLength - Máximo de caracteres (default: 5000)
 * @returns El texto limpio o null si es inválido
 */
export function sanitizeInput(text: string | undefined | null, maxLength: number = 5000): string | null {
  if (!text || typeof text !== 'string') return null;
  
  // Trim y limitar longitud
  const cleaned = text.trim().slice(0, maxLength);
  
  if (cleaned.length === 0) return null;
  
  return cleaned;
}

/**
 * Security headers adicionales para hardening.
 */
export function setSecurityHeaders(res: any): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}
