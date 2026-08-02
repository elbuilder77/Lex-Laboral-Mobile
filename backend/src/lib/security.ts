import type { MiddlewareHandler } from 'hono';

const getAllowedOrigins = (): Set<string> =>
  new Set(
    (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

const normalizeOrigin = (value: string): string | null => {
  try {
    const url = new URL(value);
    if (url.origin !== 'null') return url.origin;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

/**
 * Valida que un origin esté permitido.
 * Si CORS_ORIGINS no está configurado, permite cualquier origin
 * (la API es para una app móvil, protegida por rate limit por IP).
 */
export function isAllowedRequestOrigin(origin: string): boolean {
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.size === 0 || allowedOrigins.has('*')) return true;
  const normalized = normalizeOrigin(origin);
  return Boolean(normalized && allowedOrigins.has(normalized));
}

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
};

/**
 * Sanitiza y valida el texto del usuario.
 * Protege contra prompts gigantes que podrían costar mucho en la API de Gemini.
 */
export function sanitizeInput(text: string | undefined | null, maxLength: number = 5000): string | null {
  if (!text || typeof text !== 'string') return null;

  const cleaned = text.trim().slice(0, maxLength);

  if (cleaned.length === 0) return null;

  return cleaned;
}
