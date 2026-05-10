import type { Locale } from "./i18n";
import type { Product, ProductVariant } from "./types";

export type ProductVariantSelection = ProductVariant & {
  key: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getProductImages(product: Product) {
  const images = [
    ...(Array.isArray(product.gallery_images) ? product.gallery_images : []),
    product.image_url,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return Array.from(new Set(images));
}

export function getProductVariants(product: Product): ProductVariantSelection[] {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  return variants
    .filter(isObject)
    .map((variant, index) => {
      const color = textOrNull(variant.color);
      const size = textOrNull(variant.size);
      const labelEn = textOrNull(variant.label_en);
      const labelAr = textOrNull(variant.label_ar);
      const price = numberOrNull(variant.price) ?? numberOrNull(variant.sale_price);
      const imageUrl = textOrNull(variant.image_url);
      const key = textOrNull(variant.id) ?? ([color, size, index].filter(Boolean).join("-") || `${product.id}-${index}`);

      return {
        id: textOrNull(variant.id),
        color,
        size,
        label_en: labelEn,
        label_ar: labelAr,
        price,
        sale_price: numberOrNull(variant.sale_price),
        sale_percent: numberOrNull(variant.sale_percent),
        image_url: imageUrl,
        stock_qty: numberOrNull(variant.stock_qty),
        sku: textOrNull(variant.sku),
        key,
      };
    })
    .filter((variant) => Boolean(variant.price || variant.sale_price || variant.image_url || variant.color || variant.size || variant.label_en || variant.label_ar));
}

export function getDefaultVariant(product: Product) {
  return getProductVariants(product)[0] ?? null;
}

export function getSelectedVariant(
  product: Product,
  selection?: { color?: string | null; size?: string | null } | null,
) {
  const variants = getProductVariants(product);
  if (variants.length === 0) {
    return null;
  }

  if (!selection) {
    return variants[0] ?? null;
  }

  const exactMatch = variants.find((variant) => {
    const colorMatch = selection.color ? variant.color === selection.color : true;
    const sizeMatch = selection.size ? variant.size === selection.size : true;
    return colorMatch && sizeMatch;
  });

  if (exactMatch) {
    return exactMatch;
  }

  if (selection.color) {
    const colorMatch = variants.find((variant) => variant.color === selection.color);
    if (colorMatch) {
      return colorMatch;
    }
  }

  if (selection.size) {
    const sizeMatch = variants.find((variant) => variant.size === selection.size);
    if (sizeMatch) {
      return sizeMatch;
    }
  }

  return variants[0] ?? null;
}

export function getVariantPrice(product: Product, variant?: ProductVariantSelection | null) {
  if (variant) {
    const salePrice = variant.sale_price ?? null;
    if (salePrice !== null && salePrice !== undefined) {
      return salePrice;
    }

    const price = variant.price ?? null;
    if (price !== null && price !== undefined) {
      return price;
    }
  }

  if (product.is_on_sale) {
    return product.sale_price ?? Math.round((product.price * (100 - (product.sale_percent ?? 0))) / 100);
  }

  return product.price;
}

export function getVariantLabel(variant: ProductVariantSelection | null | undefined, locale: Locale) {
  if (!variant) {
    return "";
  }

  const parts = [variant.color, variant.size].filter(Boolean) as string[];
  if (parts.length > 0) {
    return parts.join(" / ");
  }

  return locale === "ar" ? variant.label_ar ?? variant.label_en ?? "" : variant.label_en ?? variant.label_ar ?? "";
}

export function buildVariantSelectionKey(productId: string, variant?: ProductVariantSelection | null) {
  if (!variant) {
    return productId;
  }

  return [productId, variant.key, variant.color ?? "", variant.size ?? ""].filter(Boolean).join("::");
}