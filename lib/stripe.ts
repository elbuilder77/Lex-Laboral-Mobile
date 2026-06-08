import Stripe from 'stripe';
import { getStripeSecretKey } from './stripe-config.js';

let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const { value: stripeSecretKey } = getStripeSecretKey();

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover' as any
    });
  }
  return stripeInstance;
};
