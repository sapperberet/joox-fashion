import HomePageClient from "./home/HomePageClient";
import type { Category, Product } from "@/lib/types";
import { getSupabasePublic } from "@/lib/supabase/public";

async function getHomeData(): Promise<{
  categories: Category[];
  products: Product[];
}> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return { categories: [], products: [] };
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name_en, name_ar, slug, season, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return {
    categories: categories ?? [],
    products: products ?? [],
  };
}

export default async function Home() {
  const { categories, products } = await getHomeData();
  return <HomePageClient categories={categories} products={products} />;
}
