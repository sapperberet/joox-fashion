import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const couponId = String(formData.get("coupon_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!couponId || !email) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const now = new Date();
    const { data: coupon } = await supabase
      .from("coupons")
      .select("id, max_uses, used_count, starts_at, expires_at, is_active")
      .eq("id", couponId)
      .maybeSingle();

    if (!coupon || !coupon.is_active) {
      return Response.json({ error: "Coupon is not available" }, { status: 404 });
    }

    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return Response.json({ error: "Coupon is not active yet" }, { status: 400 });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return Response.json({ error: "Coupon has expired" }, { status: 400 });
    }

    if (typeof coupon.max_uses === "number" && (coupon.used_count ?? 0) >= coupon.max_uses) {
      return Response.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    const { data: requirement } = await supabase
      .from("coupon_requirements")
      .select("min_score, min_spend")
      .eq("coupon_id", couponId)
      .maybeSingle();

    if (requirement) {
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("points, score")
        .eq("email", email)
        .maybeSingle();

      const score = Number(profile?.score ?? 0);
      const spend = Number(profile?.points ?? 0) * 10;
      const minScore = Number(requirement.min_score ?? 0);
      const minSpend = Number(requirement.min_spend ?? 0);

      if (score < minScore || spend < minSpend) {
        return Response.json({ error: "Requirements not met" }, { status: 403 });
      }
    }

    const { data: existing } = await supabase
      .from("customer_coupon_claims")
      .select("id")
      .eq("coupon_id", couponId)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: "Already claimed" }, { status: 400 });
    }

    const { error } = await supabase.from("customer_coupon_claims").insert({
      coupon_id: couponId,
      email: email,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    revalidatePath("/");
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
