export type Season = "summer" | "winter";

export type Category = {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  season: Season | null;
  sort_order: number | null;
};

export type Product = {
  id: string;
  category_id: string | null;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean | null;
  featured: boolean | null;
  season: Season | null;
  created_at?: string;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  district?: string | null;
  landmark?: string | null;
  building_number?: string | null;
  floor?: string | null;
  apartment?: string | null;
  payment_method: "cod" | "wallet";
  payment_status: string | null;
  receipt_url: string | null;
  subtotal: number;
  discount: number;
  total: number;
  items: unknown;
  status?: string | null;
  shipping_provider?: string | null;
  shipping_tracking_number?: string | null;
  shipping_reference?: string | null;
  shipping_state?: string | null;
  shipping_error?: string | null;
  created_at: string;
};
