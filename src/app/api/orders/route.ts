import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase/public";

export async function GET(request: NextRequest) {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const phone = request.nextUrl.searchParams.get("phone")?.trim();
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 20;

  let query = supabase
    .from("orders")
    .select(
      "id, customer_name, phone, city, district, total, status, payment_status, shipping_state, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (phone) {
    query = query.eq("phone", phone);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}
