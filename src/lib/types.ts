export type Season = "summer" | "winter";

export type ProductVariant = {
  id?: string | null;
  color?: string | null;
  size?: string | null;
  label_en?: string | null;
  label_ar?: string | null;
  price?: number | null;
  sale_price?: number | null;
  sale_percent?: number | null;
  image_url?: string | null;
  stock_qty?: number | null;
  sku?: string | null;
};

export type ProductReview = {
  id: string;
  product_slug: string;
  user_name: string;
  user_email: string;
  rating: number;
  title: string;
  body: string;
  sort_order?: number | null;
  created_at: string;
};

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
  is_on_sale?: boolean | null;
  sale_price?: number | null;
  sale_percent?: number | null;
  is_active: boolean | null;
  featured: boolean | null;
  season: Season | null;
  gallery_images?: string[] | null;
  variants?: ProductVariant[] | null;
  stock_qty?: number | null;
  min_order_qty?: number | null;
  max_order_qty?: number | null;
  order_multiple?: number | null;
  bundle_qty?: number | null;
  bundle_price?: number | null;
  created_at?: string;
};

export type CartItem = {
  id: string;
  cart_key: string;
  slug: string;
  name_en: string;
  name_ar: string;
  price: number;
  image_url: string | null;
  variant?: ProductVariant | null;
  variant_label?: string | null;
  variant_color?: string | null;
  variant_size?: string | null;
  variant_image_url?: string | null;
  variant_price?: number | null;
  variant_sale_price?: number | null;
  variant_sale_percent?: number | null;
  variant_sku?: string | null;
  quantity: number;
  stock_qty?: number | null;
  min_order_qty?: number | null;
  max_order_qty?: number | null;
  order_multiple?: number | null;
  bundle_qty?: number | null;
  bundle_price?: number | null;
};

export type CartCoupon = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal?: number | null;
  min_score?: number | null;
  min_spend?: number | null;
  requires_claim?: boolean;
};

export type Deal = {
  id: string;
  name_en: string;
  name_ar: string;
  deal_type: "buy_x_get_y" | "buy_x_of_product_get_y_free";
  trigger_product_ids: string[] | null;
  applicable_product_ids: string[];
  buy_quantity: number;
  free_quantity: number;
  is_active: boolean;
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
  payment_method: "cod" | "wallet" | "instapay";
  payment_status: string | null;
  receipt_url: string | null;
  subtotal: number;
  discount: number;
  total: number;
  items: unknown;
  status?: string | null;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  shipping_provider?: string | null;
  shipping_tracking_number?: string | null;
  shipping_reference?: string | null;
  shipping_state?: string | null;
  shipping_error?: string | null;
  created_at: string;
};
