import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { copy } from "@/lib/i18n";
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

      <DealsClient
        deals={deals ?? []}
        products={products ?? []}
        adminToken={token}
      />
    </div>
  );
}
