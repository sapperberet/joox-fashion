import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { OrderEntry } from "@/lib/order-insights";

export async function getAdminOrders(limit = 300): Promise<OrderEntry[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, customer_name, phone, city, district, total, status, payment_status, shipping_state, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) {
      return [];
    }
    return data as OrderEntry[];
  } catch {
    return [];
  }
}
