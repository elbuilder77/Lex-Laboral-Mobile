import { describe, expect, it, beforeEach } from 'vitest';
import { isAllowedRequestOrigin, sanitizeInput } from './security';

describe('isAllowedRequestOrigin', () => {
  beforeEach(() => {
    delete process.env.CORS_ORIGINS;
  });

  it('permite cualquier origin cuando CORS_ORIGINS no está configurado', () => {
    expect(isAllowedRequestOrigin('https://cualquier-dominio.com')).toBe(true);
    expect(isAllowedRequestOrigin('capacitor://localhost')).toBe(true);
  });

  it('permite exactamente los origins configurados', () => {
    process.env.CORS_ORIGINS = 'https://lexlaboral.com.mx,https://localhost:5173,capacitor://localhost';
    expect(isAllowedRequestOrigin('https://lexlaboral.com.mx')).toBe(true);
    expect(isAllowedRequestOrigin('https://localhost:5173')).toBe(true);
    expect(isAllowedRequestOrigin('capacitor://localhost')).toBe(true);
  });

  it('rechaza origins que solo tienen un prefijo de un dominio permitido', () => {
    process.env.CORS_ORIGINS = 'https://lexlaboral.com.mx';
    expect(isAllowedRequestOrigin('https://lexlaboral.com.mx.evil.test')).toBe(false);
    expect(isAllowedRequestOrigin('https://evil-lexlaboral.com.mx')).toBe(false);
  });

  it('normaliza puertos y trailing slash', () => {
    process.env.CORS_ORIGINS = 'https://lexlaboral.com.mx';
    expect(isAllowedRequestOrigin('https://lexlaboral.com.mx/')).toBe(true);
    expect(isAllowedRequestOrigin('https://lexlaboral.com.mx:443')).toBe(true);
    expect(isAllowedRequestOrigin('https://lexlaboral.com.mx:444')).toBe(false);
  });

  it('permite todo con comodín', () => {
    process.env.CORS_ORIGINS = '*';
    expect(isAllowedRequestOrigin('https://cualquier-dominio.com')).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('limpia y recorta el texto', () => {
    expect(sanitizeInput('  hola  ')).toBe('hola');
    expect(sanitizeInput('a'.repeat(6000))).toHaveLength(5000);
  });

  it('retorna null para entradas vacías o inválidas', () => {
    expect(sanitizeInput(undefined)).toBeNull();
    expect(sanitizeInput(null)).toBeNull();
    expect(sanitizeInput('')).toBeNull();
    expect(sanitizeInput('   ')).toBeNull();
    expect(sanitizeInput(123 as any)).toBeNull();
  });
});
