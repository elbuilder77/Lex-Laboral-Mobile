/**
 * Rate Limiter para Vercel Serverless Functions
 * 
 * ¿Qué es esto?
 * Limita cuántas veces una misma IP puede llamar a un endpoint en un periodo de tiempo.
 * Esto protege contra:
 * - Bots que consuman tu API de Gemini (que cuesta dinero)
 * - Ataques de fuerza bruta
 * - Abuso general de endpoints
 * 
 * ¿Cómo funciona?
 * Usa un Map en memoria que guarda { IP → [timestamps de requests] }.
 * Cuando un request llega, cuenta cuántos fueron en la ventana de tiempo.
 * Si excede el límite, retorna 429 (Too Many Requests).
 * 
 * NOTA: En Vercel Serverless, cada instancia tiene su propia memoria,
 * así que el rate limit no es 100% exacto pero sí efectivo contra abuso.
 * Para producción heavy, se puede migrar a Vercel KV o Upstash Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpia entradas viejas cada 5 minutos para no acumular memoria
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  const cutoff = now - windowMs;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Verifica si una IP ha excedido el rate limit.
 * 
 * @param ip - Dirección IP del cliente
 * @param maxRequests - Máximo de requests permitidos en la ventana
 * @param windowMs - Ventana de tiempo en milisegundos (default: 60s)
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  cleanup(windowMs);
  
  const now = Date.now();
  const cutoff = now - windowMs;
  
  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(ip, entry);
  }
  
  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(t => t > cutoff);
  
  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }
  
  entry.timestamps.push(now);
  
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Extrae la IP del cliente desde los headers de Vercel.
 * Vercel pone la IP real en el header 'x-forwarded-for'.
 */
export function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Middleware helper: aplica rate limit y retorna 429 si se excede.
 * Retorna `true` si el request fue bloqueado (ya se envió la respuesta).
 */
export function applyRateLimit(
  req: any,
  res: any,
  maxRequests: number,
  windowMs: number = 60_000
): boolean {
  const ip = getClientIp(req);
  const result = checkRateLimit(ip, maxRequests, windowMs);
  
  // Set rate limit headers (standard)
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  
  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    res.status(429).json({
      error: 'Demasiadas solicitudes. Por favor espere antes de reintentar.',
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
    });
    return true; // blocked
  }
  
  return false; // allowed
}
