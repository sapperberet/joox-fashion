import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productKey = url.searchParams.get("productKey")?.trim();
  if (!productKey) {
    return NextResponse.json({ reviews: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, product_slug, user_name, user_email, rating, title, body, is_visible, created_at")
    .eq("product_slug", productKey)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ reviews: [] }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Sign in to review this product." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        productKey?: string;
        userName?: string;
        userEmail?: string;
        rating?: number;
        title?: string;
        body?: string;
      }
    | null;

  const productKey = body?.productKey?.trim();

  if (!productKey || !body.userName || !body.userEmail || !body.title || !body.body) {
    return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user || userData.user.email !== body.userEmail) {
    return NextResponse.json({ error: "Sign in to review this product." }, { status: 401 });
  }

  const reviewRecord = {
    product_slug: productKey,
    user_id: userData.user.id,
    user_name: body.userName,
    user_email: body.userEmail,
    rating: Math.max(1, Math.min(5, Math.round(body.rating ?? 5))),
    title: body.title.trim(),
    body: body.body.trim(),
    is_visible: true,
  };

  const { data, error } = await supabase
    .from("product_reviews")
    .upsert(reviewRecord, { onConflict: "product_slug,user_id" })
    .select("id, product_slug, user_name, user_email, rating, title, body, is_visible, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to save review." }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}