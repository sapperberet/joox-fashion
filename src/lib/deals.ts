import type { CartItem, Deal } from "./types";

/**
 * Identify which deals apply to the given cart items
 * Returns deals with calculated free items count
 */
export function getApplicableDeals(
  items: CartItem[],
  deals: Deal[] = []
): (Deal & { freeItemsCount: number; freeItemsValue: number })[] {
  if (!Array.isArray(deals) || deals.length === 0 || items.length === 0) {
    return [];
  }

  const applicableDeals: (Deal & { freeItemsCount: number; freeItemsValue: number })[] = [];

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

    // Get unit prices of applicable items
    const applicableItems = items.filter((item) => applicableIds.has(item.id));
    if (applicableItems.length === 0) {
      continue;
    }

    const applicableUnitPrices = applicableItems
      .flatMap((item) => {
        const quantity = Math.max(0, Math.floor(item.quantity));
        const price = item.variant_price ?? item.price ?? 0;
        return Array(quantity).fill(price);
      })
      .sort((a, b) => a - b);

    if (applicableUnitPrices.length === 0) {
      continue;
    }

    // Calculate free items based on deal type
    let freeItemsCount = 0;
    let freeItemsValue = 0;

    if (deal.deal_type === "buy_x_get_y") {
      const groupSize = buyQty + freeQty;
      const qualifyingGroups = Math.floor(applicableUnitPrices.length / groupSize);
      freeItemsCount = qualifyingGroups * freeQty;

      // Get the cheapest items (sorted ascending)
      const cheapest = applicableUnitPrices.slice(0, freeItemsCount);
      freeItemsValue = cheapest.reduce((sum, price) => sum + price, 0);
    } else if (deal.deal_type === "buy_x_of_product_get_y_free") {
      const triggerIds = new Set((deal.trigger_product_ids ?? []).filter(Boolean));
      if (triggerIds.size === 0) {
        continue;
      }

      // Count trigger product quantity
      const triggerQty = items.reduce((sum, item) => {
        if (!triggerIds.has(item.id)) {
          return sum;
        }
        return sum + Math.max(0, Math.floor(item.quantity));
      }, 0);

      if (triggerQty > 0) {
        freeItemsCount = Math.floor(triggerQty / buyQty) * freeQty;

        // Get the cheapest applicable items
        const cheapest = applicableUnitPrices.slice(0, freeItemsCount);
        freeItemsValue = cheapest.reduce((sum, price) => sum + price, 0);
      }
    }

    if (freeItemsCount > 0 && freeItemsValue > 0) {
      applicableDeals.push({
        ...deal,
        freeItemsCount,
        freeItemsValue,
      });
    }
  }

  return applicableDeals;
}

/**
 * Get a human-readable description of a deal
 */
export function getDealDescription(deal: Deal, locale: "en" | "ar"): string {
  const name = locale === "ar" ? deal.name_ar : deal.name_en;
  if (deal.deal_type === "buy_x_get_y") {
    return `${name}: Buy ${deal.buy_quantity} get ${deal.free_quantity} free`;
  } else {
    return `${name}: Buy ${deal.buy_quantity} of selected product, get ${deal.free_quantity} free`;
  }
}
