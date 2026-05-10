import AdminShell from "@/app/admin/AdminShell";
import { getAdminOrders } from "@/lib/admin-orders";
import { formatCurrency } from "@/lib/format";
import { aggregateCustomers } from "@/lib/order-insights";
import Link from "next/link";

type AdminSearchProps = {
  searchParams?: {
    q?: string;
  };
};

export default async function AdminSearchPage({ searchParams }: AdminSearchProps) {
  const query = (searchParams?.q ?? "").trim().toLowerCase();
  const orders = await getAdminOrders(400);
  const customers = aggregateCustomers(orders);

  const matchedOrders = query
    ? orders.filter((order) =>
        [order.id, order.customer_name, order.phone, order.city, order.status, order.payment_status]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : orders.slice(0, 40);

  const matchedCustomers = query
    ? customers.filter((customer) =>
        [customer.customer_name, customer.phone, customer.city].join(" ").toLowerCase().includes(query),
      )
    : customers.slice(0, 20);

  return (
    <AdminShell title="Admin Search" active="search">
      <form action="/admin/search" className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
        <label htmlFor="q" className="text-xs uppercase tracking-[0.3em] text-gold">
          Search customers and entries
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="q"
            name="q"
            defaultValue={searchParams?.q ?? ""}
            placeholder="Order id, customer name, phone, city"
            className="w-full rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
          />
          <button type="submit" className="rounded-xl bg-gold px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
            Search
          </button>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Customers</h2>
          <div className="mt-4 grid gap-3">
            {matchedCustomers.slice(0, 30).map((customer) => (
              <Link key={customer.key} href={`/admin/customers/${encodeURIComponent(customer.key)}`} className="rounded-xl border border-gold/20 bg-obsidian/60 p-3 text-sm text-sand/80 transition hover:border-gold/40 hover:bg-gold/5">
                <div className="font-semibold">{customer.customer_name}</div>
                <div className="font-mono text-xs text-sand/60">{customer.phone}</div>
                <div className="mt-1 text-xs">
                  {customer.city} · {customer.orders_count} orders · {customer.points} points
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Entries</h2>
          <div className="mt-4 grid gap-3">
            {matchedOrders.slice(0, 40).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-gold/20 bg-obsidian/60 p-3 text-sm text-sand/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{entry.id}</span>
                  <span className="text-xs uppercase text-gold">{entry.status ?? "new"}</span>
                </div>
                <div className="mt-1">{entry.customer_name}</div>
                <div className="text-xs text-sand/60">{entry.phone}</div>
                <div className="mt-1 text-xs">
                  {entry.city} · {formatCurrency(entry.total, "en")} · {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
