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

type ProductsPageProps = {
  searchParams?: {
    category?: string;
  };
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const category = String(searchParams?.category ?? "").trim().toLowerCase();
  return (
    <ProductsClient
      products={products}
      categories={categories}
      initialCategorySlug={category}
    />
  );
}
