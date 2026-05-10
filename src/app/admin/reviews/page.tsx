import AdminShell from "@/app/admin/AdminShell";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteReview, toggleReviewVisibility } from "./actions";

type AdminReviewRow = {
  id: string;
  product_slug: string;
  user_name: string;
  user_email: string;
  rating: number;
  title: string;
  body: string;
  is_visible: boolean;
  created_at: string;
};

type ReviewPageProps = {
  searchParams?: {
    q?: string;
    slug?: string;
    flash?: string;
    kind?: "success" | "error" | "info";
  };
};

export default async function AdminReviewsPage({ searchParams }: ReviewPageProps) {
  const query = (searchParams?.q ?? "").trim().toLowerCase();
  const productSlug = (searchParams?.slug ?? "").trim();
  const supabase = getSupabaseAdmin();

  let dbQuery = supabase
    .from("product_reviews")
    .select("id, product_slug, user_name, user_email, rating, title, body, is_visible, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (productSlug) {
    dbQuery = dbQuery.eq("product_slug", productSlug);
  }

  const { data } = await dbQuery;
  const reviews = (data ?? []) as AdminReviewRow[];

  const filtered = query
    ? reviews.filter((review) =>
        [review.product_slug, review.user_name, review.user_email, review.title, review.body]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : reviews;

  const average = filtered.length > 0 ? filtered.reduce((sum, review) => sum + review.rating, 0) / filtered.length : 0;
  const visibleCount = filtered.filter((review) => review.is_visible).length;
  const flash = searchParams?.flash ? { code: searchParams.flash, kind: searchParams.kind ?? "info" } : null;

  return (
    <AdminShell title="Admin Reviews" active="reviews" flash={flash}>
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Reviews" value={String(filtered.length)} />
          <Metric label="Visible" value={String(visibleCount)} />
          <Metric label="Average" value={filtered.length > 0 ? average.toFixed(1) : "0.0"} />
        </div>

        <form action="/admin/reviews" className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              name="q"
              defaultValue={searchParams?.q ?? ""}
              placeholder="Search title, body, email, product"
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
            />
            <input
              name="slug"
              defaultValue={searchParams?.slug ?? ""}
              placeholder="Product slug"
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
            />
            <button type="submit" className="rounded-xl bg-gold px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
              Filter
            </button>
          </div>
        </form>

        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 text-sm text-sand/60 temple-panel">
              No reviews found.
            </div>
          ) : (
            filtered.map((review) => (
              <article key={review.id} className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-gold/70">{review.product_slug}</div>
                    <h3 className="mt-2 text-lg font-semibold text-sand">{review.title}</h3>
                    <div className="mt-1 text-xs text-sand/60">{review.user_name} · {review.user_email}</div>
                    <div className="mt-2 flex gap-1 text-gold">
                      {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
                        <span key={star}>{star <= review.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${review.is_visible ? "border-emerald/30 text-emerald" : "border-red-500/30 text-red-400"}`}>
                      {review.is_visible ? "Visible" : "Hidden"}
                    </span>
                    <span className="rounded-full border border-gold/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-sand/75">{review.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <form action={toggleReviewVisibility}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <input type="hidden" name="is_visible" value={review.is_visible ? "false" : "true"} />
                    <input type="hidden" name="q" value={searchParams?.q ?? ""} />
                    <input type="hidden" name="slug" value={searchParams?.slug ?? ""} />
                    <button type="submit" className="rounded-full border border-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                      {review.is_visible ? "Hide" : "Show"}
                    </button>
                  </form>
                  <form action={deleteReview}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <input type="hidden" name="q" value={searchParams?.q ?? ""} />
                    <input type="hidden" name="slug" value={searchParams?.slug ?? ""} />
                    <button type="submit" className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
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