import HomePageClient from "./home/HomePageClient";
import type { Category, Product } from "@/lib/types";
import { getSupabasePublic } from "@/lib/supabase/public";
import { getMostSoldProducts } from "@/lib/most-sold";

async function getHomeData(): Promise<{
  categories: Category[];
  products: Product[];
  mostSold: Product[];
}> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return { categories: [], products: [], mostSold: [] };
  }

  const [{ data: categories }, { data: products }, mostSold] = await Promise.all([
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
    getMostSoldProducts(8),
  ]);

  return {
    categories: categories ?? [],
    products: products ?? [],
    mostSold,
  };
}

export default async function Home() {
  const { categories, products, mostSold } = await getHomeData();
  return (
    <HomePageClient
      categories={categories}
      products={products}
      mostSoldProducts={mostSold}
    />
  );
}
