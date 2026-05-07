import Image from "next/image";
import { verifyAdminToken } from "@/lib/admin-auth";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Category, Order, Product } from "@/lib/types";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  loginAdmin,
  logoutAdmin,
  toggleProductActive,
  updateOrderStatus,
  updateProduct,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "./actions";

const labels = copy.en.admin;

async function getAdminData(): Promise<{
  categories: Category[];
  products: Product[];
  coupons: any[];
  orders: Order[];
}> {
  const supabase = getSupabaseAdmin();

  const [{ data: categories }, { data: products }, { data: coupons }, { data: orders }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name_en, name_ar, slug, season, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
          .select(
            "id, category_id, name_en, name_ar, slug, description_en, description_ar, price, image_url, is_active, featured, season, stock_qty, min_order_qty, max_order_qty, order_multiple, is_on_sale, sale_price, sale_percent",
          )
        .order("created_at", { ascending: false }),
      supabase
        .from("coupons")
        .select("id, code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select(
          "id, customer_name, phone, address, city, district, landmark, building_number, floor, apartment, payment_method, payment_status, receipt_url, subtotal, discount, total, items, status, shipping_provider, shipping_tracking_number, shipping_reference, shipping_state, shipping_error, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return {
    categories: categories ?? [],
    products: products ?? [],
    coupons: coupons ?? [],
    orders: orders ?? [],
  };
}

type AdminPageProps = {
  searchParams?: { token?: string };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const token = searchParams?.token ?? "";
  const isAuthorized = verifyAdminToken(token);
  const envReady =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  const statusOptions = [
    { value: "new", label: labels.statusNew },
    { value: "confirmed", label: labels.statusConfirmed },
    { value: "packed", label: labels.statusPacked },
    { value: "shipped", label: labels.statusShipped },
    { value: "delivered", label: labels.statusDelivered },
    { value: "cancelled", label: labels.statusCancelled },
  ];

  const paymentOptions = [
    { value: "pending", label: labels.paymentPending },
    { value: "paid", label: labels.paymentPaid },
    { value: "failed", label: labels.paymentFailed },
    { value: "refunded", label: labels.paymentRefunded },
  ];

  const shippingOptions = [
    { value: "pending", label: labels.shippingPending },
    { value: "created", label: labels.shippingCreated },
    { value: "in_transit", label: labels.shippingInTransit },
    { value: "delivered", label: labels.shippingDelivered },
    { value: "failed", label: labels.shippingFailed },
  ];

  if (!isAuthorized) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-20">
        <form
          action={loginAdmin}
          className="flex w-full flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-8"
        >
          <h1 className="font-display text-2xl tracking-[0.2em] text-gold">
            {labels.loginTitle}
          </h1>
          <input
            name="username"
            placeholder={labels.username}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="password"
            type="password"
            placeholder={labels.password}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <button
            type="submit"
            className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
          >
            {labels.signIn}
          </button>
        </form>
      </main>
    );
  }

  if (!envReady) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-sand/70">
        Supabase env vars are missing. Set SUPABASE_URL and
        SUPABASE_SERVICE_ROLE_KEY to continue.
      </main>
    );
  }

  const { categories, products, orders } = await getAdminData();

  // fetch coupons server-side (separate so we can show them)
  const supabase = getSupabaseAdmin();
  const { data: couponsData } = await supabase
    .from("coupons")
    .select(
      "id, code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active",
    )
    .order("created_at", { ascending: false });
  const coupons = couponsData ?? [];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
          {labels.title}
        </h1>
        <form action={logoutAdmin}>
          <button className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {labels.signOut}
          </button>
        </form>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          action={createCategory}
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6"
        >
          <input type="hidden" name="admin_token" value={token} />
          <h2 className="font-display text-xl tracking-[0.2em] text-gold">
            {labels.createCategory}
          </h2>
          <input
            name="name_en"
            placeholder={labels.nameEn}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="name_ar"
            placeholder={labels.nameAr}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="slug"
            placeholder={labels.slug}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <select
            name="season"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">{labels.season}</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
          </select>
          <input
            name="sort_order"
            type="number"
            min={0}
            placeholder="Sort order"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <button className="rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 hover:shadow-lg inline-flex items-center justify-center w-full">
            {labels.createCategory}
          </button>
        </form>

        <form
          action={createProduct}
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6"
        >
          <input type="hidden" name="admin_token" value={token} />
          <h2 className="font-display text-xl tracking-[0.2em] text-gold">
            {labels.createProduct}
          </h2>
          <input
            name="name_en"
            placeholder={labels.nameEn}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="name_ar"
            placeholder={labels.nameAr}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="slug"
            placeholder={labels.slug}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <select
            name="season"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">{labels.season}</option>
            <option value="summer">Summer</option>
            <option value="winter">Winter</option>
          </select>
          <select
            name="category_id"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">{labels.categories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_en}
              </option>
            ))}
          </select>
          <input
            name="price"
            type="number"
            min={0}
            step="1"
            placeholder={labels.price}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <input
            name="stock_qty"
            type="number"
            min={0}
            step="1"
            placeholder={labels.stockQty}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              name="min_order_qty"
              type="number"
              min={1}
              step="1"
              placeholder={labels.minOrderQty}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
            <input
              name="max_order_qty"
              type="number"
              min={1}
              step="1"
              placeholder={labels.maxOrderQty}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
            <input
              name="order_multiple"
              type="number"
              min={1}
              step="1"
              placeholder={labels.orderMultiple}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="bundle_qty"
              type="number"
              min={0}
              step="1"
              placeholder={labels.bundleQty}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
            <input
              name="bundle_price"
              type="number"
              min={0}
              step="0.01"
              placeholder={labels.bundlePrice}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_on_sale" value="true" className="h-4 w-4" />
              <span className="text-xs text-sand/60">Sale</span>
            </label>
            <input name="sale_price" type="number" min={0} step="0.01" placeholder="Sale price (EGP)" className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
            <input name="sale_percent" type="number" min={0} max={100} step="1" placeholder="Sale % off" className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand" />
          </div>
          <input
            name="image"
            type="file"
            accept="image/*"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <textarea
            name="description_en"
            placeholder={labels.descriptionEn}
            rows={2}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <textarea
            name="description_ar"
            placeholder={labels.descriptionAr}
            rows={2}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />
          <button className="rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-gold/90 hover:shadow-lg inline-flex items-center justify-center w-full">
            {labels.createProduct}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold">
          {labels.products}
        </h2>
        <div className="mt-4 space-y-3">
              {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/10 bg-obsidian/70 px-4 py-3 text-sm text-sand"
            >
              <div className="flex items-center gap-4">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name_en} width={64} height={80} className="rounded-md object-cover" />
                ) : (
                  <div className="h-16 w-12 rounded-md bg-obsidian/40" />
                )}
                <div className="flex flex-col">
                  <span>{product.name_en}</span>
                  <span className="text-xs text-sand/60">
                    {formatCurrency(product.price, "en")}
                  </span>
                  {product.stock_qty !== null && product.stock_qty !== undefined && (
                    <span className="text-xs text-sand/40">
                      {labels.stockQty}: {product.stock_qty}
                    </span>
                  )}
                  {(product.bundle_qty || product.bundle_price) && (
                    <div className="text-xs text-sand/40">
                      Bundle: {product.bundle_qty ?? '-'} for {product.bundle_price ? formatCurrency(product.bundle_price, 'en') : '-'}
                    </div>
                  )}
                  {product.is_on_sale && (
                    <div className="text-xs text-red-400">On sale: {product.sale_price ? formatCurrency(product.sale_price,'en') : `${product.sale_percent}% off`}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                <span className="text-sand/60">
                  {product.is_active ? labels.active : labels.inactive}
                </span>
                <form action={toggleProductActive}>
                  <input type="hidden" name="admin_token" value={token} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <input
                    type="hidden"
                    name="next_state"
                    value={product.is_active ? "false" : "true"}
                  />
                  <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">
                    {labels.toggle}
                  </button>
                </form>
                  <form action={deleteProduct} className="flex items-center justify-end">
                  <input type="hidden" name="admin_token" value={token} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">
                    {labels.delete}
                  </button>
                </form>
                    <form action={updateProduct} className="flex items-center gap-2">
                      <input type="hidden" name="admin_token" value={token} />
                      <input type="hidden" name="product_id" value={product.id} />
                      <input name="stock_qty" defaultValue={product.stock_qty ?? ''} type="number" className="w-20 rounded-2xl border border-gold/20 bg-obsidian px-2 py-1 text-xs text-sand" />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" name="is_on_sale" value="true" defaultChecked={!!product.is_on_sale} />
                        <span>Sale</span>
                      </label>
                      <input name="sale_price" defaultValue={product.sale_price ?? ''} type="number" step="0.01" placeholder="Sale" className="w-24 rounded-2xl border border-gold/20 bg-obsidian px-2 py-1 text-xs text-sand" />
                      <input name="sale_percent" defaultValue={product.sale_percent ?? ''} type="number" step="1" placeholder="%" className="w-16 rounded-2xl border border-gold/20 bg-obsidian px-2 py-1 text-xs text-sand" />
                      <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">Update</button>
                    </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold">Coupons</h2>
        <form action={createCoupon} className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input type="hidden" name="admin_token" value={token} />
          <input name="code" placeholder="Code" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
          <select name="type" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
          </select>
          <input name="value" type="number" min={0} step="0.01" placeholder="Value" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
          <div className="flex gap-2">
            <input name="min_subtotal" type="number" min={0} step="0.01" placeholder="Min subtotal" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
            <input name="max_uses" type="number" min={0} step="1" placeholder="Max uses" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
          </div>
          <div className="flex gap-2">
            <input name="starts_at" type="date" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
            <input name="expires_at" type="date" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
            <button className="rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink">Add</button>
          </div>
        </form>

        <div className="mt-4 space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="grid grid-cols-1 gap-2 rounded-2xl border border-gold/10 bg-obsidian/70 px-4 py-3 text-sm text-sand md:grid-cols-3">
              <div>
                <div className="font-medium">{c.code}</div>
                <div className="text-xs text-sand/60">{c.type} — {c.value}</div>
                <div className="text-xs text-sand/60">Min: {c.min_subtotal ?? 0} • Uses: {c.used_count ?? 0}/{c.max_uses ?? '∞'}</div>
                <div className="text-xs text-sand/60">{c.starts_at ? `From ${new Date(c.starts_at).toLocaleDateString()}` : ''} {c.expires_at ? `Until ${new Date(c.expires_at).toLocaleDateString()}` : ''}</div>
              </div>
              <form action={updateCoupon} className="flex items-center gap-2">
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="coupon_id" value={c.id} />
                <input name="code" defaultValue={c.code} className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
                <input name="value" defaultValue={String(c.value)} type="number" step="0.01" className="rounded-2xl border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand" />
                <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">{labels.update}</button>
              </form>
              <form action={deleteCoupon} className="flex items-center justify-end">
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="coupon_id" value={c.id} />
                <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">{labels.delete}</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold">
          {labels.categories}
        </h2>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/10 bg-obsidian/70 px-4 py-3 text-sm text-sand"
            >
              <div>
                <span>{category.name_en}</span>
                <span className="ml-2 text-xs text-sand/60">{category.slug}</span>
              </div>
              <form action={deleteCategory}>
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="category_id" value={category.id} />
                <button className="rounded-full border border-gold/30 px-3 py-2 text-gold">
                  {labels.delete}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <h2 className="font-display text-xl tracking-[0.2em] text-gold">
          {labels.orders}
        </h2>
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col gap-3 rounded-2xl border border-gold/10 bg-obsidian/70 px-4 py-4 text-sm text-sand"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div>{order.customer_name}</div>
                  <div className="text-xs text-sand/60">{order.phone}</div>
                </div>
                <div className="text-gold">
                  {formatCurrency(order.total, "en")}
                </div>
              </div>
              <div className="text-xs text-sand/60">
                {order.city}
                {order.district ? `, ${order.district}` : ""} — {order.address}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-sand/60">
                <span>{order.payment_method}</span>
                {order.receipt_url && (
                  <a
                    href={order.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold"
                  >
                    {labels.receipt}
                  </a>
                )}
              </div>
              {(order.shipping_tracking_number || order.shipping_reference) && (
                <div className="text-xs text-sand/60">
                  {order.shipping_provider ? `${order.shipping_provider}: ` : ""}
                  {order.shipping_tracking_number ?? order.shipping_reference}
                </div>
              )}
              {order.shipping_error && (
                <div className="text-xs text-clay">{order.shipping_error}</div>
              )}
              <form
                action={updateOrderStatus}
                className="grid gap-3 rounded-2xl border border-gold/10 bg-obsidian/80 p-3 text-xs"
              >
                <input type="hidden" name="admin_token" value={token} />
                <input type="hidden" name="order_id" value={order.id} />
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-2">
                    <span className="uppercase tracking-[0.2em] text-sand/60">
                      {labels.status}
                    </span>
                    <select
                      name="status"
                      defaultValue={order.status ?? "new"}
                      className="rounded-xl border border-gold/20 bg-obsidian px-3 py-2 text-sand"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="uppercase tracking-[0.2em] text-sand/60">
                      {labels.paymentStatus}
                    </span>
                    <select
                      name="payment_status"
                      defaultValue={order.payment_status ?? "pending"}
                      className="rounded-xl border border-gold/20 bg-obsidian px-3 py-2 text-sand"
                    >
                      {paymentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="uppercase tracking-[0.2em] text-sand/60">
                      {labels.shippingStatus}
                    </span>
                    <select
                      name="shipping_state"
                      defaultValue={order.shipping_state ?? "pending"}
                      className="rounded-xl border border-gold/20 bg-obsidian px-3 py-2 text-sand"
                    >
                      {shippingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className="w-fit rounded-full border border-gold/40 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-gold">
                  {labels.update}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
