import CategoriesClient from "./CategoriesClient";
import { verifyAdminToken } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Category } from "@/lib/types";

async function getCategories(): Promise<Category[]> {
  const supabase = getSupabaseAdmin();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_en, name_ar, slug, season, sort_order, type, parent_category_id, description_en, description_ar, icon_url, is_active")
    .order("sort_order", { ascending: true });
  return categories ?? [];
}

type CategoriesPageProps = {
  searchParams?: {
    admin_token?: string;
    flash?: string;
    kind?: "success" | "error" | "info";
  };
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const token = searchParams?.admin_token ?? "";
  const isAuthorized = verifyAdminToken(token);
  const envReady =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const categories = isAuthorized && envReady ? await getCategories() : [];

  return (
    <CategoriesClient
      token={token}
      isAuthorized={isAuthorized}
      envReady={Boolean(envReady)}
      flash={searchParams?.flash ? { code: searchParams.flash, kind: searchParams.kind ?? "info" } : null}
      categories={categories}
    />
  );
}
