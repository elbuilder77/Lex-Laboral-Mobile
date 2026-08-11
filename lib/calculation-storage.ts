export const CALCULATION_STORAGE_KEYS = {
  labor: 'lexlaboral.calculation.labor.v1',
  socialSecurity: 'lexlaboral.calculation.social-security.v1',
  pension: 'lexlaboral.calculation.pension.v1',
} as const;

export interface CalculationSnapshot<TInputs, TResults> {
  savedAt: string;
  inputs: TInputs;
  results: TResults;
}

export const loadCalculationSnapshot = <TInputs, TResults>(key: string): CalculationSnapshot<TInputs, TResults> | null => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as CalculationSnapshot<TInputs, TResults> : null;
  } catch {
    return null;
  }
};

export const saveCalculationSnapshot = <TInputs, TResults>(key: string, value: CalculationSnapshot<TInputs, TResults>): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The calculation remains usable in memory when storage is unavailable.
  }
};

export interface RecentCalculation {
  key: string;
  savedAt: string;
}

export const getMostRecentCalculation = (): RecentCalculation | null => {
  const snapshots = Object.values(CALCULATION_STORAGE_KEYS).flatMap((key) => {
    const snapshot = loadCalculationSnapshot<unknown, unknown>(key);
    return snapshot?.savedAt ? [{ key, savedAt: snapshot.savedAt }] : [];
  });

  return snapshots.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))[0] ?? null;
};

export const formatCalculationDate = (savedAt: string | null): string => {
  if (!savedAt) return 'ahora';
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'recientemente';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
