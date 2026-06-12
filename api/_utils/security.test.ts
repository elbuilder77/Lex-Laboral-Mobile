import { describe, expect, it } from 'vitest';
import { isAllowedRequestOrigin } from './security';

describe('request origin validation', () => {
  it('allows exact configured origins', () => {
    expect(isAllowedRequestOrigin('https://lexlaboral.com.mx', '')).toBe(true);
    expect(isAllowedRequestOrigin('https://www.lexlaboral.com.mx', '')).toBe(true);
  });

  it('rejects origins that only prefix-match an allowed domain', () => {
    expect(isAllowedRequestOrigin('https://lexlaboral.com.mx.evil.test', '')).toBe(false);
    expect(isAllowedRequestOrigin('https://www.lexlaboral.com.mx.attacker.test', '')).toBe(false);
  });

  it('falls back to referer origin when origin is absent', () => {
    expect(isAllowedRequestOrigin('', 'https://lexlaboral.com.mx/generador-documentos')).toBe(true);
    expect(isAllowedRequestOrigin('', 'https://evil.test/generador-documentos')).toBe(false);
  });

  it('does not allow referer fallback when origin is explicitly rejected', () => {
    expect(isAllowedRequestOrigin('https://evil.test', 'https://lexlaboral.com.mx/generador-documentos')).toBe(false);
  });
});
