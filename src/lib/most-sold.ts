import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Product } from "@/lib/types";

type OrderItem = {
  product_id?: string | null;
  quantity?: number | null;
};

type OrderRow = {
  items?: unknown;
};

function parseOrderItems(raw: unknown): OrderItem[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw as OrderItem[];
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed as OrderItem[];
      }
    } catch {
      return [];
    }
  }

  return [];
}

export async function getMostSoldProducts(limit = 8, orderLimit = 300): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return [];
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("items")
    .order("created_at", { ascending: false })
    .limit(orderLimit);

  if (error || !Array.isArray(orders)) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const order of orders as OrderRow[]) {
    const items = parseOrderItems(order.items);
    for (const item of items) {
      const productId = String(item?.product_id ?? "").trim();
      const quantity = Number(item?.quantity ?? 0);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }
      counts.set(productId, (counts.get(productId) ?? 0) + Math.floor(quantity));
    }
  }

  if (counts.size === 0) {
    return [];
  }

  const topIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(limit, 1))
    .map(([id]) => id);

  if (topIds.length === 0) {
    return [];
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", topIds)
    .eq("is_active", true);

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));

  return topIds
    .map((id) => productMap.get(id))
    .filter((product): product is Product => {
      if (!product) {
        return false;
      }
      const stockQty = product.stock_qty ?? null;
      return stockQty === null || stockQty > 0;
    });
}
