export type OrderEntry = {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  district: string | null;
  total: number;
  status: string | null;
  payment_status: string | null;
  shipping_state: string | null;
  created_at: string;
};

export type CustomerSummary = {
  key: string;
  customer_name: string;
  phone: string;
  city: string;
  orders_count: number;
  spend_total: number;
  last_order_at: string;
  points: number;
  score: number;
};

export function calculatePoints(totalAmount: number) {
  return Math.max(Math.floor(totalAmount / 10), 0);
}

export function calculateScore(points: number, ordersCount: number) {
  return points + ordersCount * 25;
}

export function aggregateCustomers(orders: OrderEntry[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const key = order.phone || order.customer_name;
    const existing = map.get(key);
    if (!existing) {
      const spend = Number(order.total ?? 0);
      const points = calculatePoints(spend);
      map.set(key, {
        key,
        customer_name: order.customer_name,
        phone: order.phone,
        city: order.city,
        orders_count: 1,
        spend_total: spend,
        last_order_at: order.created_at,
        points,
        score: calculateScore(points, 1),
      });
      continue;
    }

    existing.orders_count += 1;
    existing.spend_total += Number(order.total ?? 0);
    if (new Date(order.created_at).getTime() > new Date(existing.last_order_at).getTime()) {
      existing.last_order_at = order.created_at;
      existing.city = order.city;
      existing.customer_name = order.customer_name;
    }
    existing.points = calculatePoints(existing.spend_total);
    existing.score = calculateScore(existing.points, existing.orders_count);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime(),
  );
}
