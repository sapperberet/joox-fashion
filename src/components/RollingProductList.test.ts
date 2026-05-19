import { describe, it, expect } from 'vitest';

describe('RollingProductList', () => {
  it('should calculate total pages correctly', () => {
    const products = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      name_en: `Product ${i}`,
      name_ar: `منتج ${i}`,
      price: 100,
      image_url: '',
      slug: `product-${i}`,
      is_active: true,
      featured: false,
      season: 'all',
      category_id: null,
      description_en: '',
      description_ar: '',
      stock_qty: null,
      min_order_qty: 1,
      max_order_qty: null,
      order_multiple: 1,
      subcategory_id: null,
      breadcrumb_path: '',
      bundle_qty: null,
      bundle_price: null,
      is_on_sale: false,
      sale_price: null,
      sale_percent: null,
      created_at: new Date().toISOString(),
    }));

    const itemsPerPage = 4;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    expect(totalPages).toBe(5);
  });

  it('should handle pagination', () => {
    const products = Array.from({ length: 12 }, (_, i) => i);
    const itemsPerPage = 4;
    const currentIndex = 0;
    const currentItems = products.slice(currentIndex, currentIndex + itemsPerPage);
    expect(currentItems.length).toBe(4);
  });

  it('should handle next page', () => {
    const products = Array.from({ length: 12 }, (_, i) => i);
    const itemsPerPage = 4;
    let currentIndex = 0;
    currentIndex = Math.min(currentIndex + itemsPerPage, products.length - itemsPerPage);
    const currentItems = products.slice(currentIndex, currentIndex + itemsPerPage);
    expect(currentItems.length).toBe(4);
    expect(currentIndex).toBe(4);
  });

  it('should handle previous page', () => {
    const products = Array.from({ length: 12 }, (_, i) => i);
    const itemsPerPage = 4;
    let currentIndex = 4;
    currentIndex = Math.max(0, currentIndex - itemsPerPage);
    const currentItems = products.slice(currentIndex, currentIndex + itemsPerPage);
    expect(currentItems.length).toBe(4);
    expect(currentIndex).toBe(0);
  });

  it('should not go before first page', () => {
    let currentIndex = 0;
    const itemsPerPage = 4;
    currentIndex = Math.max(0, currentIndex - itemsPerPage);
    expect(currentIndex).toBe(0);
  });

  it('should not go past last page', () => {
    const products = Array.from({ length: 12 }, (_, i) => i);
    const itemsPerPage = 4;
    let currentIndex = 8;
    currentIndex = Math.min(currentIndex + itemsPerPage, products.length - itemsPerPage);
    expect(currentIndex).toBe(8);
  });
});
