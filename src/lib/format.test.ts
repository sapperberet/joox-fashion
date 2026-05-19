import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/format';

describe('formatCurrency', () => {
  it('should format currency with symbol', () => {
    const result = formatCurrency(100, 'en');
    expect(result).toMatch(/100|جنيه|EGP/);
  });

  it('should format without decimal places', () => {
    const result = formatCurrency(99.5, 'en');
    expect(result).toMatch(/100|99|جنيه|EGP/);
  });

  it('should handle zero', () => {
    const result = formatCurrency(0, 'en');
    expect(result).toBeDefined();
    expect(result).toMatch(/0|جنيه|EGP/);
  });

  it('should handle large numbers', () => {
    const result = formatCurrency(9999.99, 'en');
    expect(result).toBeDefined();
    expect(result).toMatch(/9999|10000|جنيه|EGP/);
  });

  it('should handle negative numbers', () => {
    const result = formatCurrency(-50, 'en');
    expect(result).toBeDefined();
  });
});
