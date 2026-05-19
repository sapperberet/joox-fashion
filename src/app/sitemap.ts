import type { MetadataRoute } from "next";
import { getSupabasePublic } from "@/lib/supabase/public";

type ProductSitemapEntry = {
  id: string;
  updated_at?: string | null;
  created_at?: string | null;
};

type CategorySitemapEntry = {
  slug: string;
  updated_at?: string | null;
  created_at?: string | null;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://joox.name";

function toAbsoluteUrl(path: string) {
  return `${siteUrl}${path}`;
}

function toDate(value?: string | null) {
  if (!value) {
    return new Date();
  }
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toAbsoluteUrl("/products"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/products/rolling"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: toAbsoluteUrl("/track"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const supabase = getSupabasePublic();
  if (!supabase) {
    return staticRoutes;
  }

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, updated_at, created_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    supabase
      .from("categories")
      .select("slug, updated_at, created_at")
      .not("slug", "is", null),
  ]);

  const products = (productsResult.data ?? []) as ProductSitemapEntry[];
  const categories = (categoriesResult.data ?? []) as CategorySitemapEntry[];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: toAbsoluteUrl(`/product/${product.id}`),
    lastModified: toDate(product.updated_at ?? product.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => Boolean(category.slug))
    .map((category) => ({
      url: toAbsoluteUrl(`/products?category=${encodeURIComponent(category.slug)}`),
      lastModified: toDate(category.updated_at ?? category.created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
