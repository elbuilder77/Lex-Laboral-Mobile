import { buffer } from 'micro';
import { supabaseAdmin } from '../../lib/supabase-admin.js';
import { getStripeConfigDiagnostics, getStripePriceId, getStripeWebhookSecret } from '../../lib/stripe-config.js';
import { getStripe } from '../../lib/stripe.js';
import { hasActiveSubscription } from '../../lib/access-policy.js';
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

const getPlanFromPriceId = (priceId: string | null | undefined): 'draft_basic' | 'mensualidad' | 'trimestralidad' | null => {
  if (!priceId) return null;

  if (priceId === getStripePriceId('draft_basic').value) return 'draft_basic';
  if (priceId === getStripePriceId('mensualidad').value) return 'mensualidad';
  if (priceId === getStripePriceId('trimestralidad').value) return 'trimestralidad';

  return null;
};

const grantSingleDocumentUse = async (userId: string) => {
  const rpcResult = await supabaseAdmin.rpc('grant_single_document_use', {
    p_user_id: userId,
    p_quantity: 1
  });

  if (!rpcResult.error) {
    return;
  }

  const entitlementRead = await supabaseAdmin
    .from('user_entitlements')
    .select('single_document_uses_remaining')
    .eq('user_id', userId)
    .maybeSingle();

  if (!entitlementRead.error) {
    if (entitlementRead.data) {
      await supabaseAdmin
        .from('user_entitlements')
        .update({ single_document_uses_remaining: (entitlementRead.data.single_document_uses_remaining || 0) + 1 })
        .eq('user_id', userId);
      return;
    }

    await supabaseAdmin
      .from('user_entitlements')
      .insert({ user_id: userId, single_document_uses_remaining: 1 });
    return;
  }

  const legacyRead = await supabaseAdmin
    .from('user_credits')
    .select('draft_basic_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (legacyRead.data) {
    await supabaseAdmin
      .from('user_credits')
      .update({ draft_basic_balance: (legacyRead.data.draft_basic_balance || 0) + 1 })
      .eq('user_id', userId);
  } else {
    await supabaseAdmin
      .from('user_credits')
      .insert({ user_id: userId, draft_basic_balance: 1 });
  }
};

const upsertSubscriptionState = async ({
  userId,
  plan,
  accessUntil,
  customerId,
  subscriptionId,
  subscriptionStatus
}: {
  userId: string;
  plan: 'mensualidad' | 'trimestralidad';
  accessUntil: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
}) => {
  const isPremium = hasActiveSubscription(true, accessUntil);
  const payload = {
    is_premium: isPremium,
    license_type: plan,
    access_until: accessUntil,
    stripe_customer_id: customerId || null,
    stripe_subscription_id: subscriptionId || null,
    subscription_status: subscriptionStatus || null,
    updated_at: new Date().toISOString()
  };

  const updateWithStripeFields = await supabaseAdmin
    .from('users')
    .update(payload)
    .eq('id', userId);

  if (!updateWithStripeFields.error) return;

  await supabaseAdmin
    .from('users')
    .update({
      is_premium: isPremium,
      license_type: plan,
      access_until: accessUntil,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
};

const syncSubscriptionFromStripe = async ({
  userId,
  subscriptionId,
  customerId,
  fallbackPlan
}: {
  userId: string;
  subscriptionId: string;
  customerId?: string | null;
  fallbackPlan?: 'mensualidad' | 'trimestralidad' | null;
}) => {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
  const firstItemPriceId = subscription.items?.data?.[0]?.price?.id || null;
  const plan = (getPlanFromPriceId(firstItemPriceId) || fallbackPlan);

  if (!plan || plan === 'draft_basic') {
    throw new Error(`Unable to resolve subscription plan for subscription ${subscriptionId}`);
  }

  const accessUntil = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await upsertSubscriptionState({
    userId,
    plan,
    accessUntil,
    customerId: typeof subscription.customer === 'string' ? subscription.customer : customerId,
    subscriptionId: subscription.id,
    subscriptionStatus: subscription.status
  });
};

const getUserIdByStripeReference = async (subscriptionId?: string | null, customerId?: string | null) => {
  if (subscriptionId) {
    const bySubscription = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (bySubscription.data?.id) return bySubscription.data.id;
  }

  if (customerId) {
    const byCustomer = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (byCustomer.data?.id) return byCustomer.data.id;
  }

  return null;
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
  if (eventId) {
    const acquired = await acquireStripeWebhookEvent(eventId, event.type);
    if (!acquired) {
      return res.json({ received: true, duplicate: true });
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.client_reference_id;
      const plan = session.metadata?.plan as 'draft_basic' | 'mensualidad' | 'trimestralidad' | undefined;

      if (!userId || !plan) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (plan === 'draft_basic') {
        await grantSingleDocumentUse(userId);
      } else if (session.subscription) {
        await syncSubscriptionFromStripe({
          userId,
          subscriptionId: String(session.subscription),
          customerId: typeof session.customer === 'string' ? session.customer : null,
          fallbackPlan: plan
        });
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as any;
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
      const userId = await getUserIdByStripeReference(subscriptionId, customerId);

      if (userId && subscriptionId) {
        await syncSubscriptionFromStripe({
          userId,
          subscriptionId,
          customerId,
          fallbackPlan: getPlanFromPriceId(invoice.lines?.data?.[0]?.price?.id || null) as 'mensualidad' | 'trimestralidad' | null
        });
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const subscriptionId = subscription.id as string;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
      const userId = await getUserIdByStripeReference(subscriptionId, customerId);

      if (userId) {
        const plan = getPlanFromPriceId(subscription.items?.data?.[0]?.price?.id || null);
        if (plan && plan !== 'draft_basic') {
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
