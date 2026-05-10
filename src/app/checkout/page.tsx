import CheckoutClient from "./CheckoutClient";
import { getSupabasePublic } from "@/lib/supabase/public";
import type { Product } from "@/lib/types";

type CheckoutPageProps = {
  searchParams?: { product?: string };
};

async function getProduct(identifier?: string): Promise<Product | null> {
  if (!identifier) {
    return null;
  }

  const supabase = getSupabasePublic();
  if (!supabase) {
    return null;
  }

  const byId = await supabase
    .from("products")
    .select("*")
    .eq("id", identifier)
    .maybeSingle();

  if (byId.data) {
    return byId.data;
  }

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", identifier)
    .maybeSingle();

  return data ?? null;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const product = await getProduct(searchParams?.product);
  return <CheckoutClient product={product} />;
}
