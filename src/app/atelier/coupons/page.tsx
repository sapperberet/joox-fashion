import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { copy } from "@/lib/i18n";
import AdminAlert from "@/components/AdminAlert";
import CouponsClient from "./CouponsClient";

type CouponsPageProps = {
  searchParams?: {
    flash?: string;
    kind?: "success" | "error" | "info";
    admin_token?: string;
  };
};

export default async function CouponsPage({ searchParams }: CouponsPageProps) {
  const token = searchParams?.admin_token;

  if (!token || !verifyAdminToken(token)) {
    redirect("/atelier");
  }

  const supabase = getSupabaseAdmin();

  const [{ data: coupons }, { data: requirements }] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, code, type, value, min_subtotal, max_uses, used_count, starts_at, expires_at, is_active")
      .order("created_at", { ascending: false }),
    supabase.from("coupon_requirements").select("coupon_id, min_score, min_spend"),
  ]);

  const requirementsMap = new Map(
    (requirements ?? []).map((r) => [
      r.coupon_id,
      { min_score: r.min_score, min_spend: r.min_spend },
    ])
  );

  const couponsWithRequirements = (coupons ?? []).map((c) => ({
    ...c,
    requirement: requirementsMap.get(c.id),
  }));

  const flashMessage = searchParams?.flash
    ? copy.en.admin.flash[searchParams.flash as keyof typeof copy.en.admin.flash]
    : undefined;
  const flashKind = searchParams?.kind ?? (searchParams?.flash ? "success" : undefined);
  const labels = copy.en.admin;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <a
          href={`/atelier?token=${encodeURIComponent(token)}`}
          className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
        >
          {labels.mainAdmin}
        </a>
        <a
          href={`/atelier/deals?admin_token=${encodeURIComponent(token)}`}
          className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
        >
          {labels.manageDeal}
        </a>
      </div>

      {flashMessage && (
        <AdminAlert
          type={flashKind ?? "info"}
          message={flashMessage}
          dismissible={true}
        />
      )}

      <CouponsClient
        coupons={couponsWithRequirements}
        adminToken={token}
      />
    </div>
  );
}
