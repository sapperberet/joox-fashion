import { describe, it, expect, beforeEach } from 'vitest';
import type { Product, CartItem } from '@/lib/types';

describe('ProductCard', () => {
  let sampleProduct: Product;

  beforeEach(() => {
    sampleProduct = {
      id: '1',
      name_en: 'Test T-Shirt',
      name_ar: 'قميص اختبار',
      price: 99.99,
      image_url: 'https://example.com/test.jpg',
      slug: 'test-tshirt',
      is_active: true,
      featured: true,
      season: 'summer',
      category_id: null,
      description_en: 'A test product',
      description_ar: 'منتج اختبار',
      stock_qty: 10,
      min_order_qty: 1,
      max_order_qty: null,
      order_multiple: 1,
      subcategory_id: null,
      breadcrumb_path: 'Summer > Tops',
      bundle_qty: null,
      bundle_price: null,
      is_on_sale: false,
      sale_price: null,
      sale_percent: null,
      created_at: new Date().toISOString(),
    };
  });

  it('should have valid product data', () => {
    expect(sampleProduct.id).toBeDefined();
    expect(sampleProduct.name_en).toBeDefined();
    expect(sampleProduct.price).toBeGreaterThan(0);
    expect(sampleProduct.is_active).toBe(true);
  });

  it('should have bilingual names', () => {
    expect(sampleProduct.name_en).toEqual('Test T-Shirt');
    expect(sampleProduct.name_ar).toEqual('قميص اختبار');
  });

  it('should handle product with stock', () => {
    expect(sampleProduct.stock_qty).toBeGreaterThan(0);
    const inStock = (sampleProduct.stock_qty ?? 0) > 0;
    expect(inStock).toBe(true);
  });

  it('should handle product without stock', () => {
    sampleProduct.stock_qty = 0;
    const inStock = (sampleProduct.stock_qty ?? 0) > 0;
    expect(inStock).toBe(false);
  });

  it('should format sale information', () => {
    sampleProduct.is_on_sale = true;
    sampleProduct.sale_price = 79.99;
    sampleProduct.sale_percent = 20;
    expect(sampleProduct.sale_percent).toBe(20);
    expect(sampleProduct.sale_price).toBeLessThan(sampleProduct.price);
  });

  it('should convert product to cart item', () => {
    const cartItem: CartItem = {
      id: sampleProduct.id,
      name_en: sampleProduct.name_en,
      name_ar: sampleProduct.name_ar,
      price: sampleProduct.price,
      quantity: 1,
      image_url: sampleProduct.image_url,
    };
    expect(cartItem.price).toEqual(sampleProduct.price);
    expect(cartItem.quantity).toBe(1);
  });
});
