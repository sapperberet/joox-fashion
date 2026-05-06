"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-obsidian text-sand">
        <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-20">
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
            Something went wrong
          </h1>
          <p className="text-sand/70">{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-fit rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
