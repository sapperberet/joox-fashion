import ProductsClient from "./ProductsClient";
import { getSupabasePublic } from "@/lib/supabase/public";
import type { Category, Product } from "@/lib/types";

async function getProducts(): Promise<Product[]> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return data ?? [];
}

async function getCategories(): Promise<Category[]> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("categories")
    .select("id, name_en, name_ar, slug, season, sort_order")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  return <ProductsClient products={products} categories={categories} />;
}
