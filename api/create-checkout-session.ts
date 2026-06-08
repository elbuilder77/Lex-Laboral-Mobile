import { getStripeConfigDiagnostics, getStripePriceId, getStripeSecretKey } from '../lib/stripe-config.js';
import { getStripe } from '../lib/stripe.js';
import { getAuthenticatedUser } from './_utils/auth.js';
import { applyRateLimit } from './_utils/rateLimit.js';
import { handlePreflight, validateOrigin, setSecurityHeaders } from './_utils/security.js';

const buildCheckoutReturnUrl = (clientUrl: string, hash: 'payment-success' | 'payment-cancelled', includeSessionId = false) => {
  const url = new URL(clientUrl);
  if (includeSessionId) {
    url.searchParams.set('checkout_session_id', '{CHECKOUT_SESSION_ID}');
  }
  url.hash = hash;
  return url.toString();
};

export default async function handler(req: any, res: any) {
  try {
    // Security: CORS preflight
    if (handlePreflight(req, res)) return;
    setSecurityHeaders(res);

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Security: Rate limit — max 10 requests per minute per IP
    if (applyRateLimit(req, res, 10, 60_000)) return;

    // Security: Origin validation
    if (validateOrigin(req, res)) return;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { plan, userId } = body;
    const validPlans = new Set(['draft_basic', 'mensualidad', 'trimestralidad']);

    if (!validPlans.has(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return res.status(401).json({ error: 'Debes iniciar sesión para comprar dentro de Lex Laboral.' });
    }

    const priceResolution = getStripePriceId(plan);
    const priceId = priceResolution.value;
    const secretKeyResolution = getStripeSecretKey();
    const clientUrl = process.env.CLIENT_URL?.trim() || process.env.VITE_CLIENT_URL?.trim() || 'https://lexlaboral.com.mx';

    console.log(
      `[Stripe] Creating session for plan: ${plan}, priceSource: ${priceResolution.source || 'missing'}, userId: ${userId}`
    );

    if (!priceId) {
      const diagnostics = getStripeConfigDiagnostics();
      console.error('[Stripe] Missing price ID for selected plan.', { plan, diagnostics });
      return res.status(500).json({
        error: `Falta configurar el price ID para el plan '${plan}' en Vercel.`,
        code: 'stripe_price_missing',
        plan
      });
    }

    if (!userId || userId !== user.id) {
      return res.status(401).json({ error: 'User must be authenticated to purchase.' });
    }

    if (!secretKeyResolution.value) {
      const diagnostics = getStripeConfigDiagnostics();
      console.error('[Stripe] Secret key missing in environment.', diagnostics);
      return res.status(500).json({
        error: 'Falta STRIPE_SECRET_KEY en las variables del proyecto de Vercel.',
        code: 'stripe_secret_missing'
      });
    }

    const stripe = getStripe();
    const isSubscription = plan === 'mensualidad' || plan === 'trimestralidad';
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: { plan: plan },
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      ...(isSubscription ? {
        subscription_data: {
          metadata: {
            plan,
            userId: user.id
          }
        }
      } : {}),
      success_url: buildCheckoutReturnUrl(clientUrl, 'payment-success', true),
      cancel_url: buildCheckoutReturnUrl(clientUrl, 'payment-cancelled'),
    });

    if (!session.url) {
      console.error('[Stripe] Checkout Session was created without a redirect URL.', { sessionId: session.id });
      return res.status(500).json({ error: 'Stripe no devolvió una URL de checkout.' });
    }

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('[Stripe] Session Creation Failure:', error);
    const errorMessage = error?.message || 'Error interno al contactar con Stripe.';
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    }
  }
}
