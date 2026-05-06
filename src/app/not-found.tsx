import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-20">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-10">
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
            Page not found
          </h1>
          <p className="mt-4 text-sand/70">
            The page you are looking for does not exist yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
          >
            Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
