import { describe, it, expect } from "vitest";
import { getApplicableDeals, getDealDescription } from "./deals";
import type { CartItem, Deal } from "./types";

const sampleProducts: Deal[] = [
  {
    id: "deal-1",
    name_en: "Summer Promo",
    name_ar: "عرض الصيف",
    deal_type: "buy_x_get_y",
    trigger_product_ids: null,
    applicable_product_ids: ["product-1", "product-2"],
    buy_quantity: 2,
    free_quantity: 1,
    is_active: true,
  },
  {
    id: "deal-2",
    name_en: "Specific Product Deal",
    name_ar: "عرض منتج محدد",
    deal_type: "buy_x_of_product_get_y_free",
    trigger_product_ids: ["product-1"],
    applicable_product_ids: ["product-3"],
    buy_quantity: 1,
    free_quantity: 1,
    is_active: true,
  },
];

const sampleCart: CartItem[] = [
  {
    id: "product-1",
    cart_key: "pk1",
    name_en: "Product 1",
    name_ar: "منتج 1",
    price: 100,
    image_url: null,
    quantity: 3,
  },
  {
    id: "product-2",
    cart_key: "pk2",
    name_en: "Product 2",
    name_ar: "منتج 2",
    price: 50,
    image_url: null,
    quantity: 2,
  },
  {
    id: "product-3",
    cart_key: "pk3",
    name_en: "Product 3",
    name_ar: "منتج 3",
    price: 75,
    image_url: null,
    quantity: 1,
  },
];

describe("getApplicableDeals", () => {
  it("should identify applicable buy-x-get-y deals", () => {
    const applicable = getApplicableDeals(sampleCart, sampleProducts);
    expect(applicable.length).toBeGreaterThan(0);
    
    const summmerPromo = applicable.find((d) => d.id === "deal-1");
    expect(summmerPromo).toBeDefined();
    expect(summmerPromo?.freeItemsCount).toBeGreaterThan(0);
  });

  it("should calculate free items correctly for buy-x-get-y deals", () => {
    const buyXGetYDeal: Deal = {
      id: "test-deal",
      name_en: "Buy 2 Get 1",
      name_ar: "اشتري 2 واحصل على 1",
      deal_type: "buy_x_get_y",
      trigger_product_ids: null,
      applicable_product_ids: ["product-1"],
      buy_quantity: 2,
      free_quantity: 1,
      is_active: true,
    };

    const cart: CartItem[] = [
      {
        id: "product-1",
        cart_key: "pk1",
        name_en: "Product 1",
        name_ar: "منتج 1",
        price: 100,
        image_url: null,
        quantity: 5,
      },
    ];

    const applicable = getApplicableDeals(cart, [buyXGetYDeal]);
    expect(applicable.length).toBe(1);
    expect(applicable[0].freeItemsCount).toBe(1); // 5 items: group size 3 (2+1), 1 complete group = 1 free
    expect(applicable[0].freeItemsValue).toBe(100); // 1 item at 100
  });

  it("should calculate free items correctly for trigger-based deals", () => {
    const triggerDeal: Deal = {
      id: "test-trigger",
      name_en: "Buy 1 Shirt Get 1 Pants",
      name_ar: "اشتري قميص احصل على بنطلون",
      deal_type: "buy_x_of_product_get_y_free",
      trigger_product_ids: ["product-1"],
      applicable_product_ids: ["product-2"],
      buy_quantity: 1,
      free_quantity: 1,
      is_active: true,
    };

    const cart: CartItem[] = [
      {
        id: "product-1",
        cart_key: "pk1",
        name_en: "Shirt",
        name_ar: "قميص",
        price: 200,
        image_url: null,
        quantity: 3,
      },
      {
        id: "product-2",
        cart_key: "pk2",
        name_en: "Pants",
        name_ar: "بنطلون",
        price: 150,
        image_url: null,
        quantity: 2,
      },
    ];

    const applicable = getApplicableDeals(cart, [triggerDeal]);
    expect(applicable.length).toBe(1);
    expect(applicable[0].freeItemsCount).toBe(3); // 3 shirts trigger 3 free pants
    expect(applicable[0].freeItemsValue).toBeLessThanOrEqual(450); // Up to 3 pants at 150
  });

  it("should not apply inactive deals", () => {
    const inactiveDeal: Deal = {
      id: "inactive",
      name_en: "Inactive Deal",
      name_ar: "عرض معطل",
      deal_type: "buy_x_get_y",
      trigger_product_ids: null,
      applicable_product_ids: ["product-1"],
      buy_quantity: 2,
      free_quantity: 1,
      is_active: false,
    };

    const applicable = getApplicableDeals(sampleCart, [inactiveDeal]);
    expect(applicable.length).toBe(0);
  });

  it("should not apply deals with no applicable products in cart", () => {
    const noapplicableDeal: Deal = {
      id: "no-applicable",
      name_en: "No Match",
      name_ar: "بدون تطابق",
      deal_type: "buy_x_get_y",
      trigger_product_ids: null,
      applicable_product_ids: ["product-999"],
      buy_quantity: 2,
      free_quantity: 1,
      is_active: true,
    };

    const applicable = getApplicableDeals(sampleCart, [noapplicableDeal]);
    expect(applicable.length).toBe(0);
  });

  it("should handle empty cart gracefully", () => {
    const applicable = getApplicableDeals([], sampleProducts);
    expect(applicable.length).toBe(0);
  });

  it("should handle null or missing deals gracefully", () => {
    const applicable1 = getApplicableDeals(sampleCart, []);
    const applicable2 = getApplicableDeals(sampleCart);
    expect(applicable1.length).toBe(0);
    expect(applicable2.length).toBe(0);
  });
});

describe("getDealDescription", () => {
  it("should return correct English description for buy-x-get-y deals", () => {
    const deal: Deal = {
      id: "test",
      name_en: "Summer Sale",
      name_ar: "عرض الصيف",
      deal_type: "buy_x_get_y",
      trigger_product_ids: null,
      applicable_product_ids: ["p1"],
      buy_quantity: 2,
      free_quantity: 1,
      is_active: true,
    };

    const desc = getDealDescription(deal, "en");
    expect(desc).toContain("Summer Sale");
    expect(desc).toContain("Buy 2");
    expect(desc).toContain("get 1 free");
  });

  it("should return correct Arabic description", () => {
    const deal: Deal = {
      id: "test",
      name_en: "Summer Sale",
      name_ar: "عرض الصيف",
      deal_type: "buy_x_get_y",
      trigger_product_ids: null,
      applicable_product_ids: ["p1"],
      buy_quantity: 2,
      free_quantity: 1,
      is_active: true,
    };

    const desc = getDealDescription(deal, "ar");
    expect(desc).toContain("عرض الصيف");
  });

  it("should indicate trigger-based deal type", () => {
    const deal: Deal = {
      id: "test",
      name_en: "Trigger Deal",
      name_ar: "عرض التفعيل",
      deal_type: "buy_x_of_product_get_y_free",
      trigger_product_ids: ["p1"],
      applicable_product_ids: ["p2"],
      buy_quantity: 1,
      free_quantity: 1,
      is_active: true,
    };

    const desc = getDealDescription(deal, "en");
    expect(desc).toContain("of selected product");
  });
});
