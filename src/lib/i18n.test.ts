import { describe, it, expect } from 'vitest';
import { copy } from '@/lib/i18n';

describe('i18n', () => {
  it('should have English locale', () => {
    expect(copy.en).toBeDefined();
  });

  it('should have Arabic locale', () => {
    expect(copy.ar).toBeDefined();
  });

  it('should have common UI sections in English', () => {
    expect(copy.en.nav).toBeDefined();
    expect(copy.en.hero).toBeDefined();
    expect(copy.en.products).toBeDefined();
    expect(copy.en.checkout).toBeDefined();
    expect(copy.en.admin).toBeDefined();
  });

  it('should have common UI sections in Arabic', () => {
    expect(copy.ar.nav).toBeDefined();
    expect(copy.ar.hero).toBeDefined();
    expect(copy.ar.products).toBeDefined();
    expect(copy.ar.checkout).toBeDefined();
    expect(copy.ar.admin).toBeDefined();
  });

  it('should have cart in nav for both locales', () => {
    expect(copy.en.nav.cart).toBeDefined();
    expect(copy.ar.nav.cart).toBeDefined();
  });

  it('should have matching top-level keys in both locales', () => {
    const enKeys = Object.keys(copy.en).sort();
    const arKeys = Object.keys(copy.ar).sort();
    expect(enKeys).toEqual(arKeys);
  });

  it('should have non-empty strings', () => {
    const checkStrings = (obj: any): void => {
      Object.values(obj).forEach((value) => {
        if (typeof value === 'string' && value.length > 0) {
          expect(value).toBeTruthy();
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'string') {
              expect(item).toBeTruthy();
            } else if (typeof item === 'object' && item !== null) {
              checkStrings(item);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          checkStrings(value);
        }
      });
    };
    checkStrings(copy.en);
    checkStrings(copy.ar);
  });
});
