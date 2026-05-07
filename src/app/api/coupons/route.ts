import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };
  const normalized = (code ?? "").trim().toUpperCase();

  if (!normalized) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active",
    )
    .eq("code", normalized)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  if (!data.is_active) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }
  if (data.expires_at && new Date(data.expires_at) < now) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  if (
    data.max_uses !== null &&
    data.max_uses !== undefined &&
    data.used_count !== null &&
    data.used_count !== undefined &&
    data.used_count >= data.max_uses
  ) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: data.code,
      type: data.type,
      value: data.value,
    },
    min_subtotal: data.min_subtotal,
  });
}
