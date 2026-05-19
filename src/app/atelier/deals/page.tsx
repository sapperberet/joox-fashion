import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { copy } from "@/lib/i18n";
import AdminAlert from "@/components/AdminAlert";
import DealsClient from "./DealsClient";

type DealsPageProps = {
  searchParams?: {
    flash?: string;
    kind?: "success" | "error" | "info";
    admin_token?: string;
  };
};

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const token = searchParams?.admin_token;

  if (!token || !verifyAdminToken(token)) {
    redirect("/atelier");
  }

  const supabase = getSupabaseAdmin();

  const [{ data: deals }, { data: products }] = await Promise.all([
    supabase.from("deals").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id, name_en, name_ar, image_url"),
  ]);

  const flashMessage = searchParams?.flash ? copy.en.admin.flash[searchParams.flash as keyof typeof copy.en.admin.flash] : undefined;
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
          href={`/atelier/coupons?admin_token=${encodeURIComponent(token)}`}
          className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
        >
          {labels.manageCoupons}
        </a>
      </div>

      {flashMessage && (
        <AdminAlert
          type={flashKind ?? "info"}
          message={flashMessage}
          dismissible={true}
        />
      )}

      <DealsClient
        deals={deals ?? []}
        products={products ?? []}
        adminToken={token}
      />
    </div>
  );
}
