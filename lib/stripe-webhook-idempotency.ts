export const STRIPE_WEBHOOK_PROCESSING_STALE_MS = 10 * 60 * 1000;

type SupabaseLikeError = {
  code?: string;
  message?: string;
} | null | undefined;

export const isDuplicateInsertError = (error: SupabaseLikeError): boolean =>
  error?.code === '23505' || /duplicate key/i.test(error?.message || '');

export const isMissingStripeWebhookTableError = (error: SupabaseLikeError): boolean =>
  error?.code === '42P01' || /stripe_webhook_events/i.test(error?.message || '');

export const isStaleProcessingEvent = (
  updatedAt: string | null | undefined,
  nowMs: number = Date.now()
): boolean => {
  if (!updatedAt) return false;

  const updatedAtMs = new Date(updatedAt).getTime();
  if (Number.isNaN(updatedAtMs)) return false;

  return nowMs - updatedAtMs > STRIPE_WEBHOOK_PROCESSING_STALE_MS;
};
