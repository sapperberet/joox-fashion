import AdminShell from "@/app/admin/AdminShell";
import { getAdminOrders } from "@/lib/admin-orders";
import { formatCurrency } from "@/lib/format";

export default async function AdminEntriesPage() {
  const orders = await getAdminOrders(200);
  const newEntries = orders.filter((order) => (order.status ?? "").toLowerCase() === "new");

  return (
    <AdminShell title="Admin New Entries" active="entries">
      <div className="grid gap-4">
        {newEntries.length === 0 ? (
          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 text-sm text-sand/60 temple-panel">
            No new entries found.
          </div>
        ) : (
          newEntries.map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-sand">{entry.customer_name}</div>
                  <div className="font-mono text-xs text-sand/60">{entry.phone}</div>
                </div>
                <div className="rounded-full border border-gold/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
                  {entry.status ?? "new"}
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-sand/75 sm:grid-cols-4">
                <div>
                  <span className="text-sand/55">Order ID</span>
                  <div className="font-mono text-xs">{entry.id}</div>
                </div>
                <div>
                  <span className="text-sand/55">Location</span>
                  <div>{entry.city}</div>
                </div>
                <div>
                  <span className="text-sand/55">Total</span>
                  <div className="text-gold">{formatCurrency(entry.total, "en")}</div>
                </div>
                <div>
                  <span className="text-sand/55">Created</span>
                  <div>{new Date(entry.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
