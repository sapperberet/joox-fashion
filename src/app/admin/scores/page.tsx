import AdminShell from "@/app/admin/AdminShell";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/format";

type CouponRequirementRow = {
  coupon_id: string;
  min_score: number | null;
  min_spend: number | null;
};

type CouponRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal: number | null;
  max_uses: number | null;
  used_count: number | null;
  is_active: boolean;
};

type ClaimRow = {
  coupon_id: string;
  email: string;
  used: boolean | null;
  used_at?: string | null;
  created_at?: string | null;
};

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  points: number | null;
  score: number | null;
  tier: string | null;
  updated_at?: string | null;
};

type ScoreStats = {
  totalCustomers: number;
  totalPoints: number;
  totalScore: number;
  totalClaims: number;
};

export default async function AdminScoresPage() {
  const supabase = getSupabaseAdmin();

  const [
    { data: profiles },
    { data: coupons },
    { data: requirements },
    { data: claims },
  ] = await Promise.all([
    supabase
      .from("customer_profiles")
      .select("email, full_name, phone, city, points, score, tier, updated_at")
      .order("score", { ascending: false })
      .limit(200),
    supabase
      .from("coupons")
      .select("id, code, type, value, min_subtotal, max_uses, used_count, is_active")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("coupon_requirements")
      .select("coupon_id, min_score, min_spend"),
    supabase
      .from("customer_coupon_claims")
      .select("coupon_id, email, used, used_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const profileRows = (profiles ?? []) as ProfileRow[];
  const couponRows = (coupons ?? []) as CouponRow[];
  const requirementRows = (requirements ?? []) as CouponRequirementRow[];
  const claimRows = (claims ?? []) as ClaimRow[];

  const requirementMap = new Map(
    requirementRows.map((row) => [row.coupon_id, row]),
  );

  const claimsByCoupon = new Map<string, { total: number; used: number }>();
  for (const claim of claimRows) {
    const entry = claimsByCoupon.get(claim.coupon_id) ?? { total: 0, used: 0 };
    entry.total += 1;
    if (claim.used) {
      entry.used += 1;
    }
    claimsByCoupon.set(claim.coupon_id, entry);
  }

  const stats: ScoreStats = {
    totalCustomers: profileRows.length,
    totalPoints: profileRows.reduce((sum, row) => sum + Number(row.points ?? 0), 0),
    totalScore: profileRows.reduce((sum, row) => sum + Number(row.score ?? 0), 0),
    totalClaims: claimRows.length,
  };

  const topCustomers = [...profileRows]
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 20);

  return (
    <AdminShell title="Admin Scores" active="scores">
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Customers" value={String(stats.totalCustomers)} />
          <Metric label="Total Points" value={String(stats.totalPoints)} />
          <Metric label="Total Score" value={String(stats.totalScore)} />
          <Metric label="Coupon Claims" value={String(stats.totalClaims)} />
        </div>

        <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Top customers</h2>
          {topCustomers.length === 0 ? (
            <p className="mt-4 text-sm text-sand/60">No customer profiles available.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-sand/80">
                <thead className="text-xs uppercase tracking-[0.2em] text-gold/70">
                  <tr>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Phone</th>
                    <th className="pb-2">Points</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">Tier</th>
                    <th className="pb-2">City</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer) => (
                    <tr key={customer.email ?? customer.phone ?? customer.full_name ?? "row"} className="border-t border-gold/10">
                      <td className="py-2 font-semibold text-sand">
                        {customer.full_name ?? "Customer"}
                      </td>
                      <td className="py-2 text-xs font-mono">{customer.email ?? "—"}</td>
                      <td className="py-2 text-xs font-mono">{customer.phone ?? "—"}</td>
                      <td className="py-2">{Number(customer.points ?? 0)}</td>
                      <td className="py-2">{Number(customer.score ?? 0)}</td>
                      <td className="py-2 text-gold/80">{customer.tier ?? "—"}</td>
                      <td className="py-2">{customer.city ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Coupon requirements</h2>
          {couponRows.length === 0 ? (
            <p className="mt-4 text-sm text-sand/60">No coupons configured.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-sand/80">
                <thead className="text-xs uppercase tracking-[0.2em] text-gold/70">
                  <tr>
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Value</th>
                    <th className="pb-2">Min subtotal</th>
                    <th className="pb-2">Min score</th>
                    <th className="pb-2">Min spend</th>
                    <th className="pb-2">Claims</th>
                    <th className="pb-2">Used</th>
                    <th className="pb-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {couponRows.map((coupon) => {
                    const requirement = requirementMap.get(coupon.id);
                    const claimStats = claimsByCoupon.get(coupon.id) ?? { total: 0, used: 0 };
                    const valueLabel =
                      coupon.type === "percent"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value, "en");
                    return (
                      <tr key={coupon.id} className="border-t border-gold/10">
                        <td className="py-2 font-semibold text-gold">{coupon.code}</td>
                        <td className="py-2">{valueLabel}</td>
                        <td className="py-2">{coupon.min_subtotal ? formatCurrency(coupon.min_subtotal, "en") : "—"}</td>
                        <td className="py-2">{requirement?.min_score ?? "—"}</td>
                        <td className="py-2">{requirement?.min_spend ? formatCurrency(requirement.min_spend, "en") : "—"}</td>
                        <td className="py-2">{claimStats.total}</td>
                        <td className="py-2">{claimStats.used}</td>
                        <td className="py-2">{coupon.is_active ? "Yes" : "No"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Recent claims</h2>
          {claimRows.length === 0 ? (
            <p className="mt-4 text-sm text-sand/60">No coupon claims yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-sand/80">
                <thead className="text-xs uppercase tracking-[0.2em] text-gold/70">
                  <tr>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Coupon</th>
                    <th className="pb-2">Used</th>
                    <th className="pb-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {claimRows.map((claim, index) => (
                    <tr key={`${claim.coupon_id}-${claim.email}-${index}`} className="border-t border-gold/10">
                      <td className="py-2 text-xs font-mono">{claim.email}</td>
                      <td className="py-2 text-gold">{couponRows.find((c) => c.id === claim.coupon_id)?.code ?? claim.coupon_id}</td>
                      <td className="py-2">{claim.used ? "Used" : "Claimed"}</td>
                      <td className="py-2 text-xs text-sand/60">{claim.used_at ?? claim.created_at ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-gold/20 bg-stone/80 p-5 temple-panel">
      <div className="text-xs uppercase tracking-[0.25em] text-gold/70">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-sand">{value}</div>
    </div>
  );
}
