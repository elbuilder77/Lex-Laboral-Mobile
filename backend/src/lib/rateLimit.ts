import type { Context } from 'hono';

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  const cutoff = now - windowMs;

  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return c.req.header('x-real-ip') || c.env?.ip || 'unknown';
}

/**
 * Aplica rate limit por IP y retorna la respuesta 429 si el request debe
 * ser bloqueado, o null si el request puede continuar.
 */
export function applyRateLimit(c: Context, maxRequests: number, windowMs: number = 60_000): Response | null {
  cleanup(windowMs);

  const ip = getClientIp(c);
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = Math.max(oldestInWindow + windowMs - now, 1000);
    c.header('Retry-After', Math.ceil(retryAfterMs / 1000).toString());
    return c.json(
      {
        error: 'Demasiadas solicitudes. Por favor espere antes de reintentar.',
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      },
      429
    );
  }

  entry.timestamps.push(now);
  return null;
}
