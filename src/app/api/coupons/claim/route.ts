import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const couponId = formData.get("coupon_id");
  const email = formData.get("email");

  if (!couponId || !email) {
    return Response.json({ error: "Missing parameters" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
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
