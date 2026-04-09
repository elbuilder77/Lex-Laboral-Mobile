export const DOCUMENT_MONTHLY_FAIR_USE_LIMIT = 100;
export const IMSS_MONTHLY_FAIR_USE_LIMIT = 250;

export const getCurrentMonthKey = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const hasActiveSubscription = (
  isPremium: boolean | null | undefined,
  accessUntil: string | Date | null | undefined
): boolean => {
  if (!isPremium || !accessUntil) return false;

  const expiration = accessUntil instanceof Date ? accessUntil : new Date(accessUntil);
  return !Number.isNaN(expiration.getTime()) && expiration.getTime() > Date.now();
};
