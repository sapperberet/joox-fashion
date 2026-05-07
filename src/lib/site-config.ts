import type { Season } from "./types";

export const siteConfig = {
  brand: "Joox Fashion",
  currency: "EGP",
  walletDiscount: 0.1,
  adminRoute: "/atelier",
  whatsapp: {
    wholesale: process.env.NEXT_PUBLIC_WHOLESALE_WHATSAPP ?? "01276157855",
    orders: process.env.NEXT_PUBLIC_ORDER_WHATSAPP ?? "01204086192",
  },
  wallets: {
    orange: process.env.NEXT_PUBLIC_WALLET_ORANGE ?? "",
    vodafone: process.env.NEXT_PUBLIC_WALLET_VODAFONE ?? "",
  },
};

type FallbackCategory = {
  season: Season;
  slug: string;
  name_en: string;
  name_ar: string;
};

export const fallbackCategories: FallbackCategory[] = [
  {
    season: "summer",
    slug: "t-shirts",
    name_en: "T-Shirts",
    name_ar: "تيشيرت",
  },
  {
    season: "summer",
    slug: "shorts",
    name_en: "Shorts",
    name_ar: "شورت",
  },
  {
    season: "summer",
    slug: "pants",
    name_en: "Light Pants",
    name_ar: "بنطلون خفيف",
  },
  {
    season: "summer",
    slug: "tank-tops",
    name_en: "Tank Tops",
    name_ar: "كات",
  },
  {
    season: "winter",
    slug: "jackets",
    name_en: "Jackets",
    name_ar: "جاكيت",
  },
  {
    season: "winter",
    slug: "pullovers",
    name_en: "Pullovers",
    name_ar: "بول أوفر",
  },
  {
    season: "winter",
    slug: "pants-winter",
    name_en: "Winter Pants",
    name_ar: "بنطلون شتوي",
  },
];

export function toWhatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0")
    ? `20${digits.slice(1)}`
    : digits.startsWith("20")
      ? digits
      : `20${digits}`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}
