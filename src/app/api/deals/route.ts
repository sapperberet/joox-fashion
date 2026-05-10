import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("deals")
    .select("id, name_en, name_ar, deal_type, trigger_product_ids, applicable_product_ids, buy_quantity, free_quantity, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ deals: [] }, { status: 500 });
  }

  return NextResponse.json({ deals: data ?? [] });
}
