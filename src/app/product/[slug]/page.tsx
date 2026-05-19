import ProductClient from "./ProductClient";
import { getSupabasePublic } from "@/lib/supabase/public";
import type { Product } from "@/lib/types";

type ProductPageProps = {
  params: { slug: string };
};

async function getProduct(productId: string): Promise<{ product: Product | null; category: any; subcategory: any }> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return { product: null, category: null, subcategory: null };
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    return { product: null, category: null, subcategory: null };
  }

  let category = null;
  let subcategory = null;

  if (product.category_id) {
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name_en, name_ar, slug")
      .eq("id", product.category_id)
      .maybeSingle();
    category = catData;
  }

  if ((product as any).subcategory_id) {
    const { data: subData } = await supabase
      .from("subcategories")
      .select("id, name_en, name_ar, slug")
      .eq("id", (product as any).subcategory_id)
      .maybeSingle();
    subcategory = subData;
  }

  return { product, category, subcategory };
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("products")
    .select("*")
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
  const { product, category, subcategory } = await getProduct(params.slug);
  const relatedProducts = product ? await getRelatedProducts(product) : [];
  return <ProductClient product={product} relatedProducts={relatedProducts} category={category} subcategory={subcategory} />;
}
