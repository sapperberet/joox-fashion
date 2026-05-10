import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; subtotal?: number; email?: string | null };
  const { code, subtotal: rawSubtotal, email: rawEmail } = body;
  const normalized = (code ?? "").trim().toUpperCase();
  const email = String(rawEmail ?? "").trim().toLowerCase();

  if (!normalized) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id, code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active",
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

  const { data: requirement } = await supabase
    .from("coupon_requirements")
    .select("min_score, min_spend")
    .eq("coupon_id", data.id)
    .maybeSingle();

  const hasRequirements = Boolean(requirement);

  if (hasRequirements && !email) {
    return NextResponse.json({ valid: false, reason: "login_required" }, { status: 401 });
  }

  if (hasRequirements && email) {
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("points, score")
      .eq("email", email)
      .maybeSingle();

    const score = Number(profile?.score ?? 0);
    const spend = Number(profile?.points ?? 0) * 10;
    const minScore = Number(requirement?.min_score ?? 0);
    const minSpend = Number(requirement?.min_spend ?? 0);

    if (score < minScore || spend < minSpend) {
      return NextResponse.json(
        { valid: false, reason: "requirements_not_met", min_score: minScore, min_spend: minSpend },
        { status: 403 },
      );
    }
  }

  if (email) {
    const { data: claim } = await supabase
      .from("customer_coupon_claims")
      .select("id, used")
      .eq("coupon_id", data.id)
      .eq("email", email)
      .maybeSingle();

    if (!claim) {
      return NextResponse.json({ valid: false, reason: "not_claimed" }, { status: 403 });
    }

    if (claim.used) {
      return NextResponse.json({ valid: false, reason: "already_used" }, { status: 403 });
    }
  }

  const subtotal = Number(rawSubtotal ?? 0);
  if (
    data.min_subtotal !== null &&
    data.min_subtotal !== undefined &&
    (!Number.isFinite(subtotal) || subtotal < Number(data.min_subtotal))
  ) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      id: data.id,
      code: data.code,
      type: data.type,
      value: data.value,
    },
    min_subtotal: data.min_subtotal,
    min_score: requirement?.min_score ?? 0,
    min_spend: requirement?.min_spend ?? 0,
    requires_claim: true,
  });
}
