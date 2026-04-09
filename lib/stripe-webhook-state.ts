import { supabaseAdmin } from './supabase-admin.js';
import {
  isDuplicateInsertError,
  isMissingStripeWebhookTableError,
  isStaleProcessingEvent,
} from './stripe-webhook-idempotency.js';

const insertProcessingEvent = async (eventId: string, eventType: string) =>
  supabaseAdmin.from('stripe_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    status: 'processing',
  });

export const acquireStripeWebhookEvent = async (eventId: string, eventType: string): Promise<boolean> => {
  const insertResult = await insertProcessingEvent(eventId, eventType);

  if (!insertResult.error) {
    return true;
  }

  if (isMissingStripeWebhookTableError(insertResult.error)) {
    console.warn('[Stripe webhook] stripe_webhook_events table is missing; duplicate suppression is disabled.');
    return true;
  }

  if (!isDuplicateInsertError(insertResult.error)) {
    console.error('[Stripe webhook] Unexpected error acquiring webhook event lock.', insertResult.error);
    return true;
  }

  const existingEventResult = await supabaseAdmin
    .from('stripe_webhook_events')
    .select('status, updated_at')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existingEventResult.error) {
    if (isMissingStripeWebhookTableError(existingEventResult.error)) {
      console.warn('[Stripe webhook] stripe_webhook_events table is missing while reading an existing event.');
      return true;
    }

    console.error('[Stripe webhook] Could not read existing webhook event state.', existingEventResult.error);
    return false;
  }

  if (
    existingEventResult.data?.status === 'processing' &&
    isStaleProcessingEvent(existingEventResult.data.updated_at)
  ) {
    const releaseStaleResult = await supabaseAdmin
      .from('stripe_webhook_events')
      .delete()
      .eq('event_id', eventId)
      .eq('status', 'processing');

    if (releaseStaleResult.error) {
      if (isMissingStripeWebhookTableError(releaseStaleResult.error)) {
        console.warn('[Stripe webhook] stripe_webhook_events table disappeared while releasing a stale event.');
        return true;
      }

      console.error('[Stripe webhook] Could not release stale webhook event state.', releaseStaleResult.error);
      return false;
    }

    const retryInsertResult = await insertProcessingEvent(eventId, eventType);
    if (!retryInsertResult.error) {
      return true;
    }

    if (isMissingStripeWebhookTableError(retryInsertResult.error)) {
      console.warn('[Stripe webhook] stripe_webhook_events table is missing on stale retry insert.');
      return true;
    }

    if (!isDuplicateInsertError(retryInsertResult.error)) {
      console.error('[Stripe webhook] Unexpected error re-acquiring stale webhook event lock.', retryInsertResult.error);
      return true;
    }
  }

  return false;
};

export const completeStripeWebhookEvent = async (eventId: string): Promise<void> => {
  const updateResult = await supabaseAdmin
    .from('stripe_webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', eventId);

  if (updateResult.error && !isMissingStripeWebhookTableError(updateResult.error)) {
    console.error('[Stripe webhook] Could not mark webhook event as processed.', updateResult.error);
  }
};

export const releaseStripeWebhookEvent = async (eventId: string): Promise<void> => {
  const deleteResult = await supabaseAdmin
    .from('stripe_webhook_events')
    .delete()
    .eq('event_id', eventId)
    .eq('status', 'processing');

  if (deleteResult.error && !isMissingStripeWebhookTableError(deleteResult.error)) {
    console.error('[Stripe webhook] Could not release webhook event lock after failure.', deleteResult.error);
  }
};
