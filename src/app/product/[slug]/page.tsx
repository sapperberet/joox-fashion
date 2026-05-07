import ProductClient from "./ProductClient";
import { getSupabasePublic } from "@/lib/supabase/public";
import type { Product } from "@/lib/types";

type ProductPageProps = {
  params: { slug: string };
};

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("products")
    .select(
      "id, category_id, name_en, name_ar, slug, description_en, description_ar, price, image_url, is_active, featured, season, created_at",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return data ?? null;
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("products")
    .select(
      "id, category_id, name_en, name_ar, slug, description_en, description_ar, price, image_url, is_active, featured, season, created_at",
    )
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(4);

  if (product.category_id) {
    query = query.eq("category_id", product.category_id);
  } else if (product.season) {
    query = query.eq("season", product.season);
  }

  const { data } = await query;
  return data ?? [];
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);
  const relatedProducts = product ? await getRelatedProducts(product) : [];
  return <ProductClient product={product} relatedProducts={relatedProducts} />;
}
