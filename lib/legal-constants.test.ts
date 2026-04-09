import { describe, expect, it } from 'vitest';
import { MEXICO_LABOR_DEFAULTS_2026 } from './legal-constants';

describe('MEXICO_LABOR_DEFAULTS_2026', () => {
  it('uses the 2026 wage defaults advertised by the product', () => {
    expect(MEXICO_LABOR_DEFAULTS_2026).toEqual({
      minWage: 312.41,
      uma: 119.35,
    });
  });
});
