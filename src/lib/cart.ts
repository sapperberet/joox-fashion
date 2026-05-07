import type { CartCoupon, CartItem } from "./types";

export type CartTotals = {
  subtotal: number;
  bundleDiscount: number;
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

export function calculateCartTotals(
  items: CartItem[],
  coupon: CartCoupon | null,
): CartTotals {
  const lineTotals = items.map((item) => calculateLineTotal(item));
  const subtotal = lineTotals.reduce((sum, line) => sum + line.total, 0);
  const bundleDiscount = lineTotals.reduce(
    (sum, line) => sum + line.bundleDiscount,
    0,
  );

  let couponDiscount = 0;
  if (coupon && subtotal > 0) {
    const minSubtotal = coupon.min_subtotal ?? 0;
    if (subtotal >= minSubtotal) {
      if (coupon.type === "percent") {
        couponDiscount = (subtotal * coupon.value) / 100;
      }
      if (coupon.type === "fixed") {
        couponDiscount = coupon.value;
      }
    }
  }

  const total = Math.max(subtotal - couponDiscount, 0);
  return {
    subtotal,
    bundleDiscount,
    couponDiscount,
    total,
  };
}
