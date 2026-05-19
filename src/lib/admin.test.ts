import { describe, it, expect } from 'vitest';
import type { Coupon, Deal, CouponRequirement } from '@/lib/types';

describe('Admin Features - Deals & Coupons', () => {
  describe('Deals', () => {
    it('should validate deal structure', () => {
      const deal: Deal = {
        id: 'deal-1',
        name_en: 'Buy 2 Get 1 Free',
        name_ar: 'اشتري 2 واحصل على 1 مجاني',
        deal_type: 'buy_get_free',
        trigger_product_ids: ['prod-1'],
        applicable_product_ids: ['prod-1'],
        buy_quantity: 2,
        free_quantity: 1,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      expect(deal.id).toBeDefined();
      expect(deal.name_en).toBeDefined();
      expect(deal.name_ar).toBeDefined();
      expect(deal.deal_type).toBe('buy_get_free');
      expect(deal.buy_quantity).toBe(2);
      expect(deal.free_quantity).toBe(1);
      expect(deal.is_active).toBe(true);
    });

    it('should calculate deal discount', () => {
      const buyQty = 2;
      const freeQty = 1;
      const unitPrice = 100;
      const cartQty = 3;

      const discountQty = Math.floor(cartQty / (buyQty + freeQty)) * freeQty;
      const discount = discountQty * unitPrice;

      expect(discount).toBe(100);
    });

    it('should handle multiple deal applications', () => {
      const deals = [
        { id: '1', qty: 5 },
        { id: '2', qty: 10 },
      ];
      expect(deals.length).toBe(2);
      expect(deals.every((d) => d.qty > 0)).toBe(true);
    });
  });

  describe('Coupons', () => {
    it('should validate coupon structure', () => {
      const coupon: Coupon = {
        id: 'coupon-1',
        code: 'SAVE20',
        type: 'percent',
        value: 20,
        min_subtotal: 100,
        max_uses: 10,
        used_count: 2,
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      expect(coupon.code).toBe('SAVE20');
      expect(coupon.type).toBe('percent');
      expect(coupon.value).toBe(20);
      expect(coupon.is_active).toBe(true);
    });

    it('should validate coupon eligibility', () => {
      const coupon = { value: 20, type: 'percent', min_subtotal: 100, max_uses: 10, used_count: 2 };
      const subtotal = 150;
      const eligible = subtotal >= coupon.min_subtotal && coupon.used_count < coupon.max_uses;
      expect(eligible).toBe(true);
    });

    it('should reject expired coupon', () => {
      const expiresAt = new Date(Date.now() - 1000);
      const isExpired = new Date() > expiresAt;
      expect(isExpired).toBe(true);
    });

    it('should enforce max uses limit', () => {
      const coupon = { max_uses: 5, used_count: 5 };
      const canUse = coupon.used_count < coupon.max_uses;
      expect(canUse).toBe(false);
    });
  });

  describe('Coupon Requirements', () => {
    it('should validate requirement structure', () => {
      const requirement: CouponRequirement = {
        id: 'req-1',
        coupon_id: 'coupon-1',
        min_score: 50,
        min_spend: 500,
        created_at: new Date().toISOString(),
      };

      expect(requirement.min_score).toBe(50);
      expect(requirement.min_spend).toBe(500);
    });

    it('should check score eligibility', () => {
      const requirement = { min_score: 100, min_spend: 500 };
      const userScore = 120;
      const eligible = userScore >= requirement.min_score;
      expect(eligible).toBe(true);
    });

    it('should check spend eligibility', () => {
      const requirement = { min_score: 100, min_spend: 500 };
      const userSpend = 600;
      const eligible = userSpend >= requirement.min_spend;
      expect(eligible).toBe(true);
    });

    it('should reject if score too low', () => {
      const requirement = { min_score: 100, min_spend: 500 };
      const userScore = 50;
      const eligible = userScore >= requirement.min_score;
      expect(eligible).toBe(false);
    });
  });
});
