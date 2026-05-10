import AdminShell from "@/app/admin/AdminShell";
import { getAdminOrders } from "@/lib/admin-orders";
import { aggregateCustomers } from "@/lib/order-insights";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

export default async function AdminCustomersPage() {
  const orders = await getAdminOrders();
  const customers = aggregateCustomers(orders);

  return (
    <AdminShell title="Admin Customers" active="customers">
      <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
        <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Customer monitoring</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-sand/80">
            <thead className="text-xs uppercase tracking-[0.2em] text-gold/70">
              <tr>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">City</th>
                <th className="pb-2">Orders</th>
                <th className="pb-2">Spend</th>
                <th className="pb-2">Points</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.key} className="border-t border-gold/10">
                  <td className="py-2">
                    <Link href={`/admin/customers/${encodeURIComponent(customer.key)}`} className="text-gold hover:underline">
                      {customer.customer_name}
                    </Link>
                  </td>
                  <td className="py-2 font-mono text-xs">{customer.phone}</td>
                  <td className="py-2">{customer.city}</td>
                  <td className="py-2">{customer.orders_count}</td>
                  <td className="py-2">{formatCurrency(customer.spend_total, "en")}</td>
                  <td className="py-2">{customer.points}</td>
                  <td className="py-2">{customer.score}</td>
                  <td className="py-2">{new Date(customer.last_order_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
