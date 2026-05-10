import Link from "next/link";

const sections = [
  {
    href: "/admin/reviews",
    title: "Reviews",
    subtitle: "Moderate product feedback and visibility",
    icon: "★",
  },
  {
    href: "/admin/customers",
    title: "Customers",
    subtitle: "View customer score, points, and profile data",
    icon: "◉",
  },
  {
    href: "/admin/entries",
    title: "Entries",
    subtitle: "Inspect new entries and latest actions",
    icon: "▣",
  },
  {
    href: "/admin/search",
    title: "Search",
    subtitle: "Find orders, customers, and content fast",
    icon: "⌕",
  },
  {
    href: "/atelier",
    title: "Commerce Admin",
    subtitle: "Products, coupons, deals, and fulfillment",
    icon: "◇",
  },
];

export default function AdminIndexPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <div className="rounded-3xl border border-gold/20 bg-stone/80 p-8 temple-panel">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/70">Admin</p>
        <h1 className="mt-3 font-display text-4xl tracking-[0.16em] text-gold">Control Center</h1>
        <p className="mt-3 max-w-2xl text-sm text-sand/70">Manage reviews, customers, search tools, and commerce operations from one place.</p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-3xl border border-gold/20 bg-obsidian/65 p-6 transition hover:border-gold/50 hover:bg-obsidian/85"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-lg text-gold">
              {section.icon}
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-[0.08em] text-gold">{section.title}</h2>
            <p className="mt-2 text-sm text-sand/70">{section.subtitle}</p>
            <div className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 group-hover:text-gold">
              Open
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
