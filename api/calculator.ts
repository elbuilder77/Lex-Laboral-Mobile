import { getAuthenticatedUser } from './_utils/auth.js';
import { applyRateLimit } from './_utils/rateLimit.js';
import { handlePreflight, setSecurityHeaders, validateOrigin } from './_utils/security.js';
import { recordImssUsage } from '../lib/server-access.js';

export default async function handler(req: any, res: any) {
  // Security: CORS preflight
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Security: Rate limit — max 20 requests per minute per IP
  if (applyRateLimit(req, res, 20, 60_000)) return;

  // Security: Origin validation
  if (validateOrigin(req, res)) return;

  const { user, error } = await getAuthenticatedUser(req);
  if (error || !user) {
    return res.status(401).json({ error: 'Inicia sesión para usar esta calculadora.' });
  }

  const accessResult = await recordImssUsage(user.id);
  if (!accessResult?.allowed) {
    if (accessResult?.reason === 'fair_use_limit') {
      return res.status(429).json({ error: 'Has alcanzado el límite de uso justo de la calculadora IMSS para este mes.' });
    }

    return res.status(402).json({ error: 'La calculadora IMSS requiere un plan mensual o trimestral activo.' });
  }

  res.json({ success: true, currentCount: accessResult.currentCount || 0 });
}
