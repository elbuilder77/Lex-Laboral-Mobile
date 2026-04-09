import { describe, expect, it } from 'vitest';
import {
  STRIPE_WEBHOOK_PROCESSING_STALE_MS,
  isDuplicateInsertError,
  isMissingStripeWebhookTableError,
  isStaleProcessingEvent,
} from './stripe-webhook-idempotency';

describe('stripe webhook idempotency helpers', () => {
  it('detects duplicate insert errors from Postgres', () => {
    expect(isDuplicateInsertError({ code: '23505' })).toBe(true);
    expect(isDuplicateInsertError({ message: 'duplicate key value violates unique constraint' })).toBe(true);
    expect(isDuplicateInsertError({ code: '42P01' })).toBe(false);
  });

  it('detects when the webhook event table is missing', () => {
    expect(isMissingStripeWebhookTableError({ code: '42P01' })).toBe(true);
    expect(isMissingStripeWebhookTableError({ message: 'relation "stripe_webhook_events" does not exist' })).toBe(true);
    expect(isMissingStripeWebhookTableError({ code: '23505' })).toBe(false);
  });

  it('marks stale processing rows after the timeout window', () => {
    const now = Date.UTC(2026, 3, 9, 12, 0, 0);
    const staleTimestamp = new Date(now - STRIPE_WEBHOOK_PROCESSING_STALE_MS - 1).toISOString();
    const freshTimestamp = new Date(now - STRIPE_WEBHOOK_PROCESSING_STALE_MS + 1).toISOString();

    expect(isStaleProcessingEvent(staleTimestamp, now)).toBe(true);
    expect(isStaleProcessingEvent(freshTimestamp, now)).toBe(false);
    expect(isStaleProcessingEvent(null, now)).toBe(false);
  });
});
