import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getStripeSecretKey, getStripeWebhookSecret } from './stripe-config';

const ORIGINAL_ENV = { ...process.env };

describe('server Stripe config', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SIGNING_SECRET;
    delete process.env.VITE_STRIPE_SECRET_KEY;
    delete process.env.VITE_STRIPE_WEBHOOK_SECRET;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('does not read VITE-prefixed secret aliases on the server', () => {
    process.env.VITE_STRIPE_SECRET_KEY = 'sk_test_publicly_leaked_alias';
    process.env.VITE_STRIPE_WEBHOOK_SECRET = 'whsec_publicly_leaked_alias';

    expect(getStripeSecretKey()).toEqual({ value: null, source: null });
    expect(getStripeWebhookSecret()).toEqual({ value: null, source: null });
  });

  it('reads only private server secret names', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_private';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_private';

    expect(getStripeSecretKey()).toEqual({ value: 'sk_test_private', source: 'STRIPE_SECRET_KEY' });
    expect(getStripeWebhookSecret()).toEqual({ value: 'whsec_private', source: 'STRIPE_WEBHOOK_SECRET' });
  });
});
