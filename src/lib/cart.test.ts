import { describe, it, expect } from 'vitest';
import { calculateCartTotals } from '@/lib/cart';
import type { CartItem } from '@/lib/types';

describe('calculateCartTotals', () => {
  const sampleItems: CartItem[] = [
    {
      id: '1',
      name_en: 'T-Shirt',
      name_ar: 'قميص',
      price: 100,
      quantity: 2,
      image_url: 'test.jpg',
    },
    {
      id: '2',
      name_en: 'Pants',
      name_ar: 'بنطال',
      price: 200,
      quantity: 1,
      image_url: 'test2.jpg',
    },
  ];

  it('should calculate subtotal correctly', () => {
    const totals = calculateCartTotals(sampleItems, null, []);
    expect(totals.subtotal).toBe(400); // 100*2 + 200*1
  });

  it('should apply percent coupon', () => {
    const coupon = { code: 'TEST10', type: 'percent', value: 10 };
    const totals = calculateCartTotals(sampleItems, coupon, []);
    expect(totals.couponDiscount).toBe(40); // 10% of 400
    expect(totals.total).toBe(360); // 400 - 40
  });

  it('should apply fixed coupon', () => {
    const coupon = { code: 'FIXED50', type: 'fixed', value: 50 };
    const totals = calculateCartTotals(sampleItems, coupon, []);
    expect(totals.couponDiscount).toBe(50);
    expect(totals.total).toBe(350); // 400 - 50
  });

  it('should handle empty cart', () => {
    const totals = calculateCartTotals([], null, []);
    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('should not apply coupon exceeding cart value', () => {
    const coupon = { code: 'HUGE', type: 'fixed', value: 500 };
    const totals = calculateCartTotals(sampleItems, coupon, []);
    expect(totals.total).toBeGreaterThanOrEqual(0);
  });

  it('should apply buy-get-free deals', () => {
    const deals = [
      {
        id: '1',
        name_en: 'Buy 1 Get 1',
        name_ar: 'اشتري 1 واحصل على 1',
        deal_type: 'buy_get_free',
        trigger_product_ids: ['1'],
        applicable_product_ids: ['1'],
        buy_quantity: 1,
        free_quantity: 1,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
    const totals = calculateCartTotals(sampleItems, null, deals);
    expect(totals.dealDiscount).toBeGreaterThan(0);
  });
});
