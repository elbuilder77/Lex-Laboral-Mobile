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

export const getStripeSecretKey = (): EnvResolution => {
  return resolveEnv('STRIPE_SECRET_KEY', 'STRIPE_SECRET');
};

export const getStripeWebhookSecret = (): EnvResolution => {
  return resolveEnv('STRIPE_WEBHOOK_SECRET', 'STRIPE_SIGNING_SECRET');
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
