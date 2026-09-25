import { describe, expect, it } from 'vitest';
import { GOVERNMENT_SOURCES, OFFICIAL_DISCLAIMER } from './legal-sources';

describe('legal-sources and official disclaimers', () => {
  it('contains an explicit non-affiliation disclaimer stating the app does not represent any government entity', () => {
    expect(OFFICIAL_DISCLAIMER.full).toContain('NO representa ni tiene afiliación');
    expect(OFFICIAL_DISCLAIMER.full).toContain('Instituto Mexicano del Seguro Social (IMSS)');
    expect(OFFICIAL_DISCLAIMER.full).toContain('INFONAVIT');
    expect(OFFICIAL_DISCLAIMER.full).toContain('Gobierno de México');
    expect(OFFICIAL_DISCLAIMER.short).toContain('NO representa ni está afiliada');
  });

  it('includes verified government sources with valid .gob.mx or official URLs', () => {
    expect(GOVERNMENT_SOURCES.length).toBeGreaterThanOrEqual(8);

    const validUrls = GOVERNMENT_SOURCES.every(source =>
      source.url.startsWith('https://') &&
      (source.url.includes('.gob.mx') || source.url.includes('.inegi.org.mx') || source.url.includes('infonavit.org.mx'))
    );
    expect(validUrls).toBe(true);

    const lft = GOVERNMENT_SOURCES.find(s => s.id === 'lft');
    expect(lft?.url).toBe('https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf');

    const lss = GOVERNMENT_SOURCES.find(s => s.id === 'lss');
    expect(lss?.url).toBe('https://www.diputados.gob.mx/LeyesBiblio/pdf/LSS.pdf');

    const imss = GOVERNMENT_SOURCES.find(s => s.id === 'imss-portal');
    expect(imss?.url).toBe('https://www.imss.gob.mx/');
  });
});
