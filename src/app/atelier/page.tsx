import AtelierClient from "./AtelierClient";
import { verifyAdminToken } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Category, Order, Product, Event } from "@/lib/types";

async function getAdminData(): Promise<{
  categories: Category[];
  products: Product[];
  coupons: any[];
  orders: Order[];
  events: Event[];
}> {
  const supabase = getSupabaseAdmin();

  const [{ data: categories }, { data: products }, { data: coupons }, { data: orders }, { data: events }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name_en, name_ar, slug, season, sort_order, type, parent_category_id, description_en, description_ar, icon_url, is_active")
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select(
          "id, category_id, name_en, name_ar, slug, description_en, description_ar, price, image_url, gallery_images, variants, is_active, featured, season, stock_qty, min_order_qty, max_order_qty, order_multiple, is_on_sale, sale_price, sale_percent, bundle_qty, bundle_price",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("coupons")
        .select("id, code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select(
          "id, customer_name, phone, address, city, district, landmark, building_number, floor, apartment, payment_method, payment_status, receipt_url, subtotal, discount, total, items, status, shipping_provider, shipping_tracking_number, shipping_reference, shipping_state, shipping_error, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("events")
        .select("id, name_en, name_ar, slug, event_type, description_en, description_ar, icon_url, banner_url, start_date, end_date, is_active, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

  return {
    categories: categories ?? [],
    products: products ?? [],
    coupons: coupons ?? [],
    orders: orders ?? [],
    events: events ?? [],
  };
}

type AdminPageProps = {
  searchParams?: {
    token?: string;
    flash?: string;
    kind?: "success" | "error" | "info";
  };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const token = searchParams?.token ?? "";
  const isAuthorized = verifyAdminToken(token);
  const envReady =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { categories, products, coupons, orders, events } = isAuthorized && envReady
    ? await getAdminData()
    : { categories: [], products: [], coupons: [], orders: [], events: [] };

  return (
    <AtelierClient
      token={token}
      isAuthorized={isAuthorized}
      envReady={Boolean(envReady)}
      flash={searchParams?.flash ? { code: searchParams.flash, kind: searchParams.kind ?? "info" } : null}
      categories={categories}
      products={products}
      coupons={coupons}
      orders={orders}
      events={events}
    />
  );
}
