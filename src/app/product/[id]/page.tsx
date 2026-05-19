import type { Metadata } from "next";
import ProductClient from "./ProductClient";
import { getSupabasePublic } from "@/lib/supabase/public";
import type { Product } from "@/lib/types";

type ProductPageProps = {
  params: { id: string };
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://joox.name";

function getProductImage(product: Product): string {
  if (product.image_url) {
    return product.image_url;
  }
  if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
    const firstGallery = product.gallery_images[0];
    if (typeof firstGallery === "string" && firstGallery.startsWith("http")) {
      return firstGallery;
    }
  }
  return `${siteUrl}/joox-fashion.png`;
}

function getProductDescription(product: Product): string {
  const descEn = product.description_en?.trim();
  const baseDesc = descEn ? descEn.substring(0, 155) : `Shop ${product.name_en} at Joox Fashion.`;
  return baseDesc;
}

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
  const { product, category, subcategory } = await getProduct(params.id);
  const relatedProducts = product ? await getRelatedProducts(product) : [];
  return <ProductClient product={product} relatedProducts={relatedProducts} category={category} subcategory={subcategory} />;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { product } = await getProduct(params.id);

  if (!product) {
    return {
      title: "Product Not Found | Joox Fashion",
      description: "The product you are looking for is not available.",
    };
  }

  const productUrl = `${siteUrl}/product/${product.id}`;
  const productImage = getProductImage(product);
  const description = getProductDescription(product);

  return {
    title: `${product.name_en} | Joox Fashion`,
    description,
    openGraph: {
      title: product.name_en,
      description,
      url: productUrl,
      type: "website",
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: product.name_en,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name_en,
      description,
      images: [productImage],
    },
    alternates: {
      canonical: productUrl,
    },
  };
}
