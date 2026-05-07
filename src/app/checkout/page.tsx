import CheckoutClient from "./CheckoutClient";
import { getSupabasePublic } from "@/lib/supabase/public";
import type { Product } from "@/lib/types";

type CheckoutPageProps = {
  searchParams?: { product?: string };
};

async function getProduct(slug?: string): Promise<Product | null> {
  if (!slug) {
    return null;
  }

  const supabase = getSupabasePublic();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("products")
    .select(
      "id, category_id, name_en, name_ar, slug, description_en, description_ar, price, image_url, is_active, featured, season, stock_qty, min_order_qty, max_order_qty, order_multiple, bundle_qty, bundle_price",
    )
    .eq("slug", slug)
    .maybeSingle();

  return data ?? null;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const product = await getProduct(searchParams?.product);
  return <CheckoutClient product={product} />;
}
