import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import RollingProductList from "@/components/RollingProductList";
import { getSupabasePublic } from "@/lib/supabase/public";
import type { Product } from "@/lib/types";

async function getRollingProducts(): Promise<Product[]> {
  const supabase = getSupabasePublic();
  if (!supabase) {
    return [];
  }
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as Product[];
}

export default async function RollingProductsPage() {
  const products = await getRollingProducts();

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">Rolling Product List</h1>
        </div>
        <RollingProductList products={products} />
      </main>
      <SiteFooter />
    </div>
  );
}
