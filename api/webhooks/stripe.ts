import { buffer } from 'micro';
import { getStripeConfigDiagnostics, getStripeWebhookSecret } from '../../lib/stripe-config.js';
import { getStripe } from '../../lib/stripe.js';
import {
  fulfillCheckoutSession,
  getPlanFromPriceId,
  getPlanFromStripeSubscription,
  getSubscriptionMetadataUserId,
  getUserIdByStripeReference,
  normalizeSubscriptionPlan,
  syncSubscriptionFromStripe,
  upsertSubscriptionState,
} from '../../lib/stripe-access.js';
import {
  acquireStripeWebhookEvent,
  completeStripeWebhookEvent,
  releaseStripeWebhookEvent,
} from '../../lib/stripe-webhook-state.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret.value) {
    const diagnostics = getStripeConfigDiagnostics();
    console.error('[Stripe webhook] Missing webhook signing secret.', diagnostics);
    return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET' });
  }

  const stripe = getStripe();

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret.value);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const eventId = typeof event.id === 'string' ? event.id : null;
  try {
    if (eventId) {
      const acquired = await acquireStripeWebhookEvent(eventId, event.type);
      if (!acquired) {
        return res.json({ received: true, duplicate: true });
      }
    }
  } catch (error) {
    console.error('Error acquiring Stripe webhook idempotency lock:', error);
    return res.status(500).json({ error: 'Webhook idempotency lock failed' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      await fulfillCheckoutSession({ session });
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as any;
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      const userId = await getUserIdByStripeReference(subscriptionId, customerId)
        || (subscriptionId ? await getSubscriptionMetadataUserId(subscriptionId) : null);

      if (userId && subscriptionId) {
        await syncSubscriptionFromStripe({
          userId,
          subscriptionId,
          customerId,
          fallbackPlan: normalizeSubscriptionPlan(getPlanFromPriceId(invoice.lines?.data?.[0]?.price?.id || null))
        });
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const subscriptionId = subscription.id as string;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
      const userId = await getUserIdByStripeReference(subscriptionId, customerId)
        || (typeof subscription.metadata?.userId === 'string' ? subscription.metadata.userId : null);

      if (userId) {
        const plan = getPlanFromStripeSubscription(subscription);
        if (plan) {
          const accessUntil = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          await upsertSubscriptionState({
            userId,
            plan,
            accessUntil,
            customerId,
            subscriptionId,
            subscriptionStatus: subscription.status
          });
        }
      }
    }

    if (eventId) {
      await completeStripeWebhookEvent(eventId);
    }
  } catch (error) {
    console.error('Error updating Supabase from webhook:', error);
    if (eventId) {
      await releaseStripeWebhookEvent(eventId);
    }
    return res.status(500).json({ error: 'Database update failed' });
  }

  res.json({ received: true });
}
