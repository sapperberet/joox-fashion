import type { Locale } from "./i18n";
import { siteConfig } from "./site-config";

export function formatCurrency(value: number, locale: Locale) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: siteConfig.currency,
    maximumFractionDigits: 0,
  }).format(safeValue);
}
