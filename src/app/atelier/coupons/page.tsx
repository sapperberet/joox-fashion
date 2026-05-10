import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { copy } from "@/lib/i18n";
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

  return (
    <div className="space-y-6">
      {flashMessage && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            flashKind === "error"
              ? "bg-red-500/20 text-red-200 border border-red-500/30"
              : "bg-green-500/20 text-green-200 border border-green-500/30"
          }`}
        >
          {flashMessage}
        </div>
      )}

      <CouponsClient
        coupons={couponsWithRequirements}
        adminToken={token}
      />
    </div>
  );
}
