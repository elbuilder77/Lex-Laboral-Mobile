type EnvResolution = {
  value: string | null;
  source: string | null;
};

const resolveEnv = (...names: string[]): EnvResolution => {
  for (const name of names) {
    const rawValue = process.env[name];
    const value = typeof rawValue === 'string' ? rawValue.trim() : '';

    if (value) {
      return { value, source: name };
    }
  }

  return { value: null, source: null };
};

const isProduction = process.env.NODE_ENV === 'production';

let warnedAboutUnsafeStripeAlias = false;

const warnIfUnsafeAlias = (source: string | null) => {
  if (!source || warnedAboutUnsafeStripeAlias) return;

  if (source.startsWith('VITE_')) {
    warnedAboutUnsafeStripeAlias = true;
    console.warn(
      `[Stripe] Using ${source} on the server. Rename it in Vercel to a non-VITE variable to avoid leaking secrets into the client build.`
    );
  }
};

export const getStripeSecretKey = (): EnvResolution => {
  const resolution = resolveEnv('STRIPE_SECRET_KEY', 'STRIPE_SECRET', 'VITE_STRIPE_SECRET_KEY');
  warnIfUnsafeAlias(resolution.source);
  return resolution;
};

export const getStripeWebhookSecret = (): EnvResolution => {
  const resolution = resolveEnv('STRIPE_WEBHOOK_SECRET', 'STRIPE_SIGNING_SECRET', 'VITE_STRIPE_WEBHOOK_SECRET');
  warnIfUnsafeAlias(resolution.source);
  return resolution;
};

export const getStripePriceId = (plan: string): EnvResolution => {
  switch (plan) {
    case 'draft_basic':
      return resolveEnv(
        'STRIPE_PRICE_DOCUMENTO',
        ...(isProduction ? [] : ['STRIPE_PRICE_DRAFT_BASIC', 'VITE_STRIPE_PRICE_DOCUMENTO'])
      );
    case 'mensualidad':
      return resolveEnv(
        'STRIPE_PRICE_MENSUALIDAD',
        ...(isProduction ? [] : ['STRIPE_PRICE_MONTHLY', 'VITE_STRIPE_PRICE_MENSUALIDAD'])
      );
    case 'trimestralidad':
      return resolveEnv(
        'STRIPE_PRICE_TRIMESTRAL',
        ...(isProduction ? [] : ['STRIPE_PRICE_QUARTERLY', 'VITE_STRIPE_PRICE_TRIMESTRAL'])
      );
    default:
      return { value: null, source: null };
  }
};

export const getStripeConfigDiagnostics = () => {
  const secretKey = getStripeSecretKey();
  const webhookSecret = getStripeWebhookSecret();

  return {
    hasStripeSecretKey: Boolean(secretKey.value),
    stripeSecretKeySource: secretKey.source,
    hasStripeWebhookSecret: Boolean(webhookSecret.value),
    stripeWebhookSecretSource: webhookSecret.source,
    hasDocumentoPrice: Boolean(getStripePriceId('draft_basic').value),
    hasMensualidadPrice: Boolean(getStripePriceId('mensualidad').value),
    hasTrimestralidadPrice: Boolean(getStripePriceId('trimestralidad').value),
    clientUrlConfigured: Boolean(resolveEnv('CLIENT_URL', 'VITE_CLIENT_URL').value),
    nodeEnv: process.env.NODE_ENV || 'undefined'
  };
};
