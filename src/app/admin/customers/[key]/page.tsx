import Link from "next/link";
import AdminShell from "@/app/admin/AdminShell";
import { getAdminOrders } from "@/lib/admin-orders";
import { aggregateCustomers, calculatePoints, calculateScore } from "@/lib/order-insights";
import { formatCurrency } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type CustomerDetailProps = {
  params: { key: string };
};

export default async function CustomerDetailPage({ params }: CustomerDetailProps) {
  const { key } = params;
  const orders = await getAdminOrders(500);
  const customers = aggregateCustomers(orders);
  const customer = customers.find((entry) => entry.key === decodeURIComponent(key));

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("email, full_name, phone, city, address, points, score, tier, likes, updated_at")
    .eq("phone", customer?.phone ?? decodeURIComponent(key))
    .maybeSingle();

  const customerOrders = orders.filter((order) => order.phone === (customer?.phone ?? decodeURIComponent(key)));
  const totalSpend = customerOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const points = calculatePoints(totalSpend);
  const score = calculateScore(points, customerOrders.length);

  return (
    <AdminShell title="Customer Detail" active="customers">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gold">{customer?.customer_name ?? profile?.full_name ?? "Customer"}</h2>
              <p className="mt-1 font-mono text-xs text-sand/60">{customer?.phone ?? profile?.phone ?? decodeURIComponent(key)}</p>
              <p className="mt-1 text-sm text-sand/70">{customer?.city ?? profile?.city ?? "Unknown city"}</p>
            </div>
            <div className="rounded-full border border-gold/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold">
              {profile?.tier ?? (score >= 3000 ? "Platinum" : score >= 1500 ? "Gold" : score >= 600 ? "Silver" : "Bronze")}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Metric label="Orders" value={String(customerOrders.length)} />
            <Metric label="Spend" value={formatCurrency(totalSpend, "en")} />
            <Metric label="Points" value={String(profile?.points ?? points)} />
            <Metric label="Score" value={String(profile?.score ?? score)} />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-sand/80">
              <thead className="text-xs uppercase tracking-[0.2em] text-gold/70">
                <tr>
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gold/10">
                    <td className="py-2 font-mono text-xs">{order.id.slice(0, 8)}</td>
                    <td className="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-2 uppercase text-xs">{order.status ?? "new"}</td>
                    <td className="py-2">{formatCurrency(order.total, "en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
            <h3 className="text-sm uppercase tracking-[0.3em] text-gold">Profile</h3>
            <div className="mt-4 grid gap-3 text-sm text-sand/80">
              <Row label="Email" value={profile?.email ?? "-"} />
              <Row label="Phone" value={profile?.phone ?? customer?.phone ?? "-"} />
              <Row label="City" value={profile?.city ?? customer?.city ?? "-"} />
              <Row label="Address" value={profile?.address ?? "-"} />
              <Row label="Wishlist items" value={String(Array.isArray(profile?.likes) ? profile.likes.length : 0)} />
            </div>
          </div>

          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
            <h3 className="text-sm uppercase tracking-[0.3em] text-gold">Actions</h3>
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/admin/search" className="rounded-full bg-gold px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                Search all customers
              </Link>
              <Link href="/admin/customers" className="rounded-full border border-gold/20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Back to list
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-obsidian/60 p-4">
      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-gold/70">{label}</div>
      <div className="mt-2 text-lg font-semibold text-sand">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-obsidian/60 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/70">{label}</div>
      <div className="mt-1 wrap-break-word text-sm text-sand">{value}</div>
    </div>
  );
}