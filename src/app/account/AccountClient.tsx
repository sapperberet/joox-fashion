"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { formatCurrency } from "@/lib/format";
import { calculatePoints, calculateScore, type OrderEntry } from "@/lib/order-insights";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { loadWishlist, saveWishlist, type WishlistItem } from "@/lib/wishlist";

type AccountProfile = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
};

const profileStorageKey = "joox-account-profile";
const settingsStorageKey = "joox-account-settings";

const emptyProfile: AccountProfile = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  address: "",
};

export default function AccountClient() {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "points">("profile");
  const [profile, setProfile] = useState<AccountProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [alerts, setAlerts] = useState({
    orderUpdates: true,
    promotions: true,
    whatsapp: false,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      router.replace("/auth");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/auth");
        return;
      }
      const metadata = data.session.user.user_metadata as Record<string, unknown> | undefined;
      const profileFromMeta: AccountProfile = {
        fullName: String(metadata?.fullName ?? ""),
        email: data.session.user.email ?? "",
        phone: String(metadata?.phone ?? ""),
        city: String(metadata?.city ?? ""),
        address: String(metadata?.address ?? ""),
      };
      setUserEmail(data.session.user.email ?? "");
      setProfile((prev) => ({
        ...prev,
        ...profileFromMeta,
        email: data.session?.user.email ?? prev.email,
      }));
      setWishlist(loadWishlist());
      setAuthReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    const raw = localStorage.getItem(profileStorageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as AccountProfile;
      setProfile({
        fullName: parsed.fullName ?? "",
        email: parsed.email ?? "",
        phone: parsed.phone ?? "",
        city: parsed.city ?? "",
        address: parsed.address ?? "",
      });
    } catch {
      setProfile(emptyProfile);
    }
  }, [authReady]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase || !userEmail) {
      return;
    }

    let mounted = true;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("customer_profiles")
        .select("email, full_name, phone, city, address, points, score, tier, settings, likes")
        .eq("email", userEmail)
        .maybeSingle();
      const profileData = data as {
        email?: string | null;
        full_name?: string | null;
        phone?: string | null;
        city?: string | null;
        address?: string | null;
        likes?: WishlistItem[] | null;
      } | null;
      if (!mounted || !profileData) {
        return;
      }
      setProfile((prev) => ({
        ...prev,
        fullName: String(profileData.full_name ?? prev.fullName ?? ""),
        email: String(profileData.email ?? userEmail),
        phone: String(profileData.phone ?? prev.phone ?? ""),
        city: String(profileData.city ?? prev.city ?? ""),
        address: String(profileData.address ?? prev.address ?? ""),
      }));
      if (Array.isArray(profileData.likes)) {
        setWishlist(profileData.likes as WishlistItem[]);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [authReady, userEmail]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (!profile.phone) {
      setOrders([]);
      return;
    }
    const controller = new AbortController();
    setLoadingOrders(true);
    fetch(`/api/orders?phone=${encodeURIComponent(profile.phone)}&limit=100`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as { orders?: OrderEntry[] };
        setOrders(Array.isArray(body.orders) ? body.orders : []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setLoadingOrders(false);
      });
    return () => controller.abort();
  }, [authReady, profile.phone]);

  const totalSpend = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
    [orders],
  );
  const points = useMemo(() => calculatePoints(totalSpend), [totalSpend]);
  const score = useMemo(() => calculateScore(points, orders.length), [points, orders.length]);
  const tier = score >= 3000 ? "Platinum" : score >= 1500 ? "Gold" : score >= 600 ? "Silver" : "Bronze";
  const wishlistCount = wishlist.length;

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getSupabaseBrowser();
    if (supabase) {
      supabase.auth.updateUser({
        data: {
          fullName: profile.fullName,
          phone: profile.phone,
          city: profile.city,
          address: profile.address,
        },
      });
      await supabase.from("customer_profiles").upsert([
        {
          email: profile.email || userEmail,
          full_name: profile.fullName,
          phone: profile.phone,
          city: profile.city,
          address: profile.address,
          points,
          score,
          tier,
          likes: wishlist,
          updated_at: new Date().toISOString(),
        },
      ] as any);
    }
    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    saveWishlist(wishlist);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      router.replace("/auth");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const handleSettingChange = (key: keyof typeof alerts, checked: boolean) => {
    const next = {
      ...alerts,
      [key]: checked,
    };
    setAlerts(next);
    localStorage.setItem(settingsStorageKey, JSON.stringify(next));
  };

  const removeWishlistItem = (slug: string) => {
    const next = wishlist.filter((item) => item.slug !== slug);
    setWishlist(next);
    saveWishlist(next);
  };

  if (!authReady) {
    return (
      <div className="relative">
        <SiteHeader />
        <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel text-sand/80">Loading account...</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="relative">
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl tracking-[0.2em] text-gold">My Account</h1>
              <p className="mt-2 text-sm text-sand/70">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "profile", label: "Profile" },
            { id: "settings", label: "Settings" },
            { id: "points", label: "Points & Score" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "profile" | "settings" | "points")}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                activeTab === tab.id
                  ? "bg-gold text-ink font-semibold"
                  : "border border-gold/30 text-gold hover:bg-gold/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <form
            onSubmit={handleSaveProfile}
            className="grid gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6 sm:grid-cols-2 temple-panel"
          >
            <input
              value={profile.fullName}
              onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
              placeholder="Full name"
            />
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
              placeholder="Email"
            />
            <input
              value={profile.phone}
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
              placeholder="Phone"
            />
            <input
              value={profile.city}
              onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))}
              className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
              placeholder="City"
            />
            <textarea
              value={profile.address}
              onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
              className="sm:col-span-2 rounded-xl border border-gold/20 bg-obsidian px-4 py-3 text-sand"
              placeholder="Address"
              rows={3}
            />
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
              >
                Update profile
              </button>
              {saved && <span className="text-sm text-emerald">Saved</span>}
            </div>
          </form>
        )}

        {activeTab === "settings" && (
          <div className="grid gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
            <div className="rounded-xl border border-gold/20 bg-obsidian px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-gold/80">Language</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${locale === "en" ? "border-gold/60 bg-gold/10" : "border-gold/20 bg-obsidian/60"}`}>
                  <span className="text-sm text-sand">🇬🇧 EN</span>
                  <input
                    type="radio"
                    name="account_language"
                    checked={locale === "en"}
                    onChange={() => setLocale("en")}
                    className="h-4 w-4 accent-gold"
                  />
                </label>
                <label className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${locale === "ar" ? "border-gold/60 bg-gold/10" : "border-gold/20 bg-obsidian/60"}`}>
                  <span className="text-sm text-sand">🇪🇬 AR</span>
                  <input
                    type="radio"
                    name="account_language"
                    checked={locale === "ar"}
                    onChange={() => setLocale("ar")}
                    className="h-4 w-4 accent-gold"
                  />
                </label>
              </div>
            </div>
            {[
              { key: "orderUpdates", label: "Order updates and delivery changes" },
              { key: "promotions", label: "Promotions and sales notifications" },
              { key: "whatsapp", label: "WhatsApp account notifications" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-xl border border-gold/20 bg-obsidian px-4 py-3">
                <span className="text-sm text-sand">{item.label}</span>
                <input
                  type="checkbox"
                  checked={alerts[item.key as keyof typeof alerts]}
                  onChange={(event) => handleSettingChange(item.key as keyof typeof alerts, event.target.checked)}
                  className="h-4 w-4 accent-gold"
                />
              </label>
            ))}
          </div>
        )}

        {activeTab === "points" && (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <MetricCard label="Orders" value={String(orders.length)} />
              <MetricCard label="Spend" value={formatCurrency(totalSpend, "en")} />
              <MetricCard label="Points" value={String(points)} />
              <MetricCard label="Score Tier" value={tier} />
            </div>

            <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Wishlist</h2>
                  <p className="mt-1 text-sm text-sand/60">{wishlistCount} saved items</p>
                </div>
                <div className="rounded-full border border-gold/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
                  Like list
                </div>
              </div>
              {wishlist.length === 0 ? (
                <p className="mt-3 text-sm text-sand/60">No saved products yet.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {wishlist.map((item) => (
                    <div key={item.slug} className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-obsidian/60 p-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gold/10 bg-obsidian">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name_en} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-sand">{item.name_en}</div>
                        <div className="text-xs text-sand/60">{formatCurrency(item.price, "en")}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWishlistItem(item.slug)}
                        className="rounded-full border border-gold/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
              <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Recent orders</h2>
              {loadingOrders ? (
                <p className="mt-3 text-sm text-sand/60">Loading...</p>
              ) : orders.length === 0 ? (
                <p className="mt-3 text-sm text-sand/60">No orders found for this phone number.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm text-sand/80">
                    <thead className="text-xs uppercase tracking-[0.2em] text-gold/70">
                      <tr>
                        <th className="pb-2">Order</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Points</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-t border-gold/10">
                          <td className="py-2 font-mono text-xs">{order.id.slice(0, 8)}</td>
                          <td className="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="py-2">{formatCurrency(order.total, "en")}</td>
                          <td className="py-2">{calculatePoints(order.total)}</td>
                          <td className="py-2 uppercase text-xs">{order.status ?? "new"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-stone/80 p-4 temple-panel">
      <div className="text-xs uppercase tracking-[0.25em] text-gold/70">{label}</div>
      <div className="mt-2 text-xl font-semibold text-sand">{value}</div>
    </div>
  );
}
