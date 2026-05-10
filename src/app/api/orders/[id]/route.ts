import { getSupabasePublic } from "@/lib/supabase/public";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabasePublic();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, customer_name, phone, address, city, district, landmark, building_number, floor, apartment, payment_method, payment_status, receipt_url, subtotal, discount, total, items, status, shipping_provider, shipping_tracking_number, shipping_reference, shipping_state, shipping_error, coupon_code, coupon_discount, created_at"
      )
      .eq("id", params.id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
