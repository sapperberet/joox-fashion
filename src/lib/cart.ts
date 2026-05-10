import type { CartCoupon, CartItem, Deal } from "./types";

export type CartTotals = {
  subtotal: number;
  bundleDiscount: number;
  dealDiscount: number;
  couponDiscount: number;
  total: number;
};

function clamp(value: number, min: number, max?: number | null) {
  let next = Math.max(value, min);
  if (max !== null && max !== undefined) {
    next = Math.min(next, max);
  }
  return next;
}

export function normalizeCartQuantity(item: CartItem, nextQty: number) {
  const minQty = Math.max(item.min_order_qty ?? 1, 1);
  const orderMultiple = Math.max(item.order_multiple ?? 1, 1);
  const maxQty = item.max_order_qty ?? item.stock_qty ?? null;

  const safe = Number.isFinite(nextQty) ? Math.floor(nextQty) : minQty;
  let quantity = clamp(safe, minQty, maxQty);

  if (orderMultiple > 1) {
    const remainder = (quantity - minQty) % orderMultiple;
    if (remainder !== 0) {
      quantity = clamp(quantity - remainder + orderMultiple, minQty, maxQty);
    }
  }

  return quantity;
}

export function calculateLineTotal(item: CartItem) {
  const bundleQty = item.bundle_qty ?? null;
  const bundlePrice = item.bundle_price ?? null;
  const quantity = Math.max(item.quantity, 1);
  if (bundleQty && bundlePrice && bundleQty > 0) {
    const bundles = Math.floor(quantity / bundleQty);
    const remainder = quantity % bundleQty;
    const bundleTotal = bundles * bundlePrice;
    const remainderTotal = remainder * item.price;
    return {
      total: bundleTotal + remainderTotal,
      bundleDiscount:
        bundles * bundleQty * item.price - Math.max(bundleTotal, 0),
    };
  }

  return { total: quantity * item.price, bundleDiscount: 0 };
}

function collectApplicableUnitPrices(items: CartItem[], applicableIds: Set<string>) {
  const prices: number[] = [];
  for (const item of items) {
    if (!applicableIds.has(item.id)) {
      continue;
    }
    const quantity = Math.max(0, Math.floor(item.quantity));
    for (let i = 0; i < quantity; i += 1) {
      prices.push(item.price);
    }
  }
  prices.sort((a, b) => a - b);
  return prices;
}

function sumCheapest(prices: number[], count: number) {
  if (count <= 0 || prices.length === 0) {
    return 0;
  }
  const limit = Math.min(count, prices.length);
  let total = 0;
  for (let i = 0; i < limit; i += 1) {
    total += prices[i] ?? 0;
  }
  return total;
}

export function calculateDealsDiscount(items: CartItem[], deals: Deal[] = []) {
  if (!Array.isArray(deals) || deals.length === 0 || items.length === 0) {
    return 0;
  }

  let discount = 0;

  for (const deal of deals) {
    if (!deal?.is_active) {
      continue;
    }

    const buyQty = Math.max(1, Number(deal.buy_quantity ?? 0));
    const freeQty = Math.max(0, Number(deal.free_quantity ?? 0));
    if (freeQty <= 0) {
      continue;
    }

    const applicableIds = new Set((deal.applicable_product_ids ?? []).filter(Boolean));
    if (applicableIds.size === 0) {
      continue;
    }

    const applicableUnitPrices = collectApplicableUnitPrices(items, applicableIds);
    if (applicableUnitPrices.length === 0) {
      continue;
    }

    if (deal.deal_type === "buy_x_get_y") {
      const groupSize = buyQty + freeQty;
      const groups = Math.floor(applicableUnitPrices.length / groupSize);
      const freeUnits = groups * freeQty;
      discount += sumCheapest(applicableUnitPrices, freeUnits);
      continue;
    }

    const triggerIds = new Set((deal.trigger_product_ids ?? []).filter(Boolean));
    if (triggerIds.size === 0) {
      continue;
    }

    const triggerQty = items.reduce((sum, item) => {
      if (!triggerIds.has(item.id)) {
        return sum;
      }
      return sum + Math.max(0, Math.floor(item.quantity));
    }, 0);

    if (triggerQty <= 0) {
      continue;
    }

    const freeUnits = Math.floor(triggerQty / buyQty) * freeQty;
    discount += sumCheapest(applicableUnitPrices, freeUnits);
  }

  return Math.max(discount, 0);
}

export function calculateCartTotals(
  items: CartItem[],
  coupon: CartCoupon | null,
  deals: Deal[] = [],
): CartTotals {
  const lineTotals = items.map((item) => calculateLineTotal(item));
  const subtotal = lineTotals.reduce((sum, line) => sum + line.total, 0);
  const bundleDiscount = lineTotals.reduce(
    (sum, line) => sum + line.bundleDiscount,
    0,
  );
  const dealDiscount = Math.min(calculateDealsDiscount(items, deals), subtotal);
  const couponBase = Math.max(subtotal - dealDiscount, 0);

  let couponDiscount = 0;
  if (coupon && couponBase > 0) {
    const minSubtotal = coupon.min_subtotal ?? 0;
    if (couponBase >= minSubtotal) {
      if (coupon.type === "percent") {
        couponDiscount = (couponBase * coupon.value) / 100;
      }
      if (coupon.type === "fixed") {
        couponDiscount = coupon.value;
      }
    }
  }

  couponDiscount = Math.min(couponDiscount, couponBase);

  const total = Math.max(subtotal - dealDiscount - couponDiscount, 0);
  return {
    subtotal,
    bundleDiscount,
    dealDiscount,
    couponDiscount,
    total,
  };
}
