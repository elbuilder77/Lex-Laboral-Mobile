import type Stripe from 'stripe';
import { hasActiveSubscription } from './access-policy.js';
import { supabaseAdmin } from './supabase-admin.js';
import { adminRpc } from './supabase-rpc.js';
import { getStripePriceId } from './stripe-config.js';
import { getStripe } from './stripe.js';
import {
  acquireStripeWebhookEvent,
  completeStripeWebhookEvent,
  releaseStripeWebhookEvent,
} from './stripe-webhook-state.js';

export type StripePlan = 'draft_basic' | 'mensualidad' | 'trimestralidad';
export type StripeSubscriptionPlan = Exclude<StripePlan, 'draft_basic'>;

const validPlans = new Set<StripePlan>(['draft_basic', 'mensualidad', 'trimestralidad']);

const errorWithStatus = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

export const getPlanFromPriceId = (priceId: string | null | undefined): StripePlan | null => {
  if (!priceId) return null;

  if (priceId === getStripePriceId('draft_basic').value) return 'draft_basic';
  if (priceId === getStripePriceId('mensualidad').value) return 'mensualidad';
  if (priceId === getStripePriceId('trimestralidad').value) return 'trimestralidad';

  return null;
};

export const normalizeStripePlan = (plan: unknown): StripePlan | null => {
  return typeof plan === 'string' && validPlans.has(plan as StripePlan) ? (plan as StripePlan) : null;
};

export const normalizeSubscriptionPlan = (plan: unknown): StripeSubscriptionPlan | null => {
  const normalized = normalizeStripePlan(plan);
  return normalized && normalized !== 'draft_basic' ? normalized : null;
};

export const getFulfillmentEventId = (checkoutSessionId: string) => `checkout_session:${checkoutSessionId}`;

const getStripeId = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value && typeof (value as { id?: unknown }).id === 'string') {
    return (value as { id: string }).id;
  }

  return null;
};

export const grantSingleDocumentUse = async (userId: string) => {
  const rpcResult = await adminRpc('grant_single_document_use', {
    p_user_id: userId,
    p_quantity: 1,
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

export const upsertSubscriptionState = async ({
  userId,
  plan,
  accessUntil,
  customerId,
  subscriptionId,
  subscriptionStatus,
}: {
  userId: string;
  plan: StripeSubscriptionPlan;
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
    updated_at: new Date().toISOString(),
  };

  // Try updating the record first and check if it exists (select 'id')
  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('id');

  if (!updateError && updatedRows && updatedRows.length > 0) {
    return;
  }

  // If the row doesn't exist, retrieve the email from auth.users and upsert it
  let email: string | null = null;
  try {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!authError && authUser?.user?.email) {
      email = authUser.user.email;
    }
  } catch (error) {
    console.error('Failed to retrieve email for upsert from auth.users:', error);
  }

  const upsertPayload = {
    id: userId,
    email,
    ...payload,
  };

  const { error: upsertError } = await supabaseAdmin
    .from('users')
    .upsert(upsertPayload);

  if (upsertError) {
    console.error('Failed to upsert subscription state:', upsertError);
    // Fallback minimal upsert
    await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email,
        is_premium: isPremium,
        license_type: plan,
        access_until: accessUntil,
        updated_at: new Date().toISOString(),
      });
  }

  // Ensure user entitlements record also exists
  try {
    await supabaseAdmin
      .from('user_entitlements')
      .upsert({ user_id: userId, single_document_uses_remaining: 0 }, { onConflict: 'user_id' });
  } catch (entitlementError) {
    console.error('Failed to upsert user entitlements:', entitlementError);
  }
};

export const getPlanFromStripeSubscription = (subscription: any): StripeSubscriptionPlan | null => {
  const firstItemPriceId = subscription.items?.data?.[0]?.price?.id || null;
  return normalizeSubscriptionPlan(getPlanFromPriceId(firstItemPriceId))
    || normalizeSubscriptionPlan(subscription.metadata?.plan);
};

export const syncSubscriptionFromStripe = async ({
  userId,
  subscriptionId,
  customerId,
  fallbackPlan,
}: {
  userId: string;
  subscriptionId: string;
  customerId?: string | null;
  fallbackPlan?: StripeSubscriptionPlan | null;
}) => {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
  const plan = getPlanFromStripeSubscription(subscription) || fallbackPlan;

  if (!plan) {
    throw new Error(`Unable to resolve subscription plan for subscription ${subscriptionId}`);
  }

  const accessUntil = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await upsertSubscriptionState({
    userId,
    plan,
    accessUntil,
    customerId: getStripeId(subscription.customer) || customerId,
    subscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
  });
};

export const getUserIdByStripeReference = async (subscriptionId?: string | null, customerId?: string | null) => {
  if (subscriptionId) {
    const bySubscription = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (bySubscription.data?.id) return bySubscription.data.id as string;
  }

  if (customerId) {
    const byCustomer = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();

    if (byCustomer.data?.id) return byCustomer.data.id as string;
  }

  return null;
};

export const getSubscriptionMetadataUserId = async (subscriptionId: string) => {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId) as any;
  return typeof subscription.metadata?.userId === 'string' ? subscription.metadata.userId as string : null;
};

export const fulfillCheckoutSession = async ({
  session,
  expectedUserId,
}: {
  session: Stripe.Checkout.Session | any;
  expectedUserId?: string | null;
}) => {
  const sessionId = typeof session.id === 'string' ? session.id : null;
  const userId = typeof session.client_reference_id === 'string' ? session.client_reference_id : null;
  const plan = normalizeStripePlan(session.metadata?.plan);

  if (!sessionId || !userId || !plan) {
    throw errorWithStatus('Checkout session is missing required fulfillment metadata.', 400);
  }

  if (expectedUserId && expectedUserId !== userId) {
    throw errorWithStatus('Checkout session does not belong to the authenticated user.', 403);
  }

  const fulfillmentEventId = getFulfillmentEventId(sessionId);
  const acquired = await acquireStripeWebhookEvent(fulfillmentEventId, 'checkout.session.fulfillment');

  if (!acquired) {
    return { fulfilled: false, duplicate: true, plan, userId };
  }

  try {
    if (plan === 'draft_basic') {
      if (session.payment_status !== 'paid') {
        throw errorWithStatus('Checkout session is not paid yet.', 409);
      }

      await grantSingleDocumentUse(userId);
    } else {
      const subscriptionId = getStripeId(session.subscription);

      if (!subscriptionId) {
        throw errorWithStatus('Checkout session is missing its Stripe subscription.', 409);
      }

      await syncSubscriptionFromStripe({
        userId,
        subscriptionId,
        customerId: getStripeId(session.customer),
        fallbackPlan: plan,
      });
    }

    await completeStripeWebhookEvent(fulfillmentEventId);
    return { fulfilled: true, duplicate: false, plan, userId };
  } catch (error) {
    await releaseStripeWebhookEvent(fulfillmentEventId);
    throw error;
  }
};
