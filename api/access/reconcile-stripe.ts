import { getUserAccessSnapshot } from '../../lib/server-access.js';
import { fulfillCheckoutSession } from '../../lib/stripe-access.js';
import { getStripe } from '../../lib/stripe.js';
import { getAuthenticatedUser } from '../_utils/auth.js';
import { applyRateLimit } from '../_utils/rateLimit.js';
import { handlePreflight, setSecurityHeaders } from '../_utils/security.js';

const getBody = (req: any) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
};

const getSessionId = (req: any) => {
  const body = getBody(req);
  if (typeof body.sessionId === 'string') return body.sessionId;
  if (typeof body.checkoutSessionId === 'string') return body.checkoutSessionId;

  const requestUrl = new URL(req.url || '/', `https://${req.headers.host || 'lexlaboral.com.mx'}`);
  return requestUrl.searchParams.get('checkout_session_id')
    || requestUrl.searchParams.get('session_id');
};

export default async function handler(req: any, res: any) {
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (applyRateLimit(req, res, 20, 60_000)) return;

  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const checkoutSessionId = getSessionId(req);
    if (!checkoutSessionId || !checkoutSessionId.startsWith('cs_')) {
      return res.status(400).json({ error: 'Falta checkout_session_id válido.' });
    }

    const session = await getStripe().checkout.sessions.retrieve(checkoutSessionId, {
      expand: ['subscription'],
    });

    const fulfillment = await fulfillCheckoutSession({
      session,
      expectedUserId: user.id,
    });
    const snapshot = await getUserAccessSnapshot(user.id);

    res.json({
      reconciled: true,
      duplicate: fulfillment.duplicate,
      snapshot,
    });
  } catch (error: any) {
    console.error('Stripe reconciliation API Error:', error);
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const message = statusCode >= 500
      ? 'No se pudo reconciliar el pago con Stripe.'
      : error?.message || 'No se pudo reconciliar el pago con Stripe.';

    res.status(statusCode).json({ error: message });
  }
}
