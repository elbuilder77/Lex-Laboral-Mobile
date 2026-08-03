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
