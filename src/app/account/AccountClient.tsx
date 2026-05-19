"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/components/SiteProviders";
import { formatCurrency } from "@/lib/format";
import { calculatePoints, calculateScore, type OrderEntry } from "@/lib/order-insights";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { loadWishlist, saveWishlist, type WishlistItem } from "@/lib/wishlist";
import CouponClaim from "@/components/CouponClaim";

type AccountProfile = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
};

type CouponRequirement = {
  min_score: number;
  min_spend: number;
};

type CouponWithRequirement = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_subtotal?: number | null;
  max_uses?: number | null;
  used_count?: number | null;
  is_active: boolean;
  requirement?: CouponRequirement;
  claimed?: boolean;
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
  const searchParams = useSearchParams();
  const { locale, setLocale } = useLanguage();
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "preferences" | "points" | "coupons">("profile");
  const [profile, setProfile] = useState<AccountProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [coupons, setCoupons] = useState<CouponWithRequirement[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [preferences, setPreferences] = useState({
    deliverySpeed: "standard" as "standard" | "express",
    preferredDeliveryTime: "anytime" as "morning" | "afternoon" | "evening" | "anytime",
    preferredCategories: ["summer", "winter"] as string[],
  });
  const [alerts, setAlerts] = useState({
    orderUpdates: true,
    promotions: true,
    whatsapp: false,
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "profile" || tab === "settings" || tab === "preferences" || tab === "points" || tab === "coupons") {
      setActiveTab(tab as "profile" | "settings" | "preferences" | "points" | "coupons");
    }
  }, [searchParams]);

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
    const raw = localStorage.getItem(settingsStorageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as typeof alerts & typeof preferences;
      if (parsed.orderUpdates !== undefined) {
        setAlerts({
          orderUpdates: parsed.orderUpdates ?? true,
          promotions: parsed.promotions ?? true,
          whatsapp: parsed.whatsapp ?? false,
        });
      }
      if (parsed.deliverySpeed !== undefined) {
        setPreferences({
          deliverySpeed: parsed.deliverySpeed ?? "standard",
          preferredDeliveryTime: parsed.preferredDeliveryTime ?? "anytime",
          preferredCategories: parsed.preferredCategories ?? ["summer", "winter"],
        });
      }
    } catch {
      // defaults already set
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
        const normalized = (profileData.likes as WishlistItem[])
          .map((item) => ({
            ...item,
            product_id: item.product_id ?? item.slug ?? "",
          }))
          .filter((item) => item.product_id);
        setWishlist(normalized);
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

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return;
    }

    let mounted = true;
    setLoadingCoupons(true);
    Promise.all([
      supabase
        .from("coupons")
        .select("id, code, type, value, min_subtotal, max_uses, used_count, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("coupon_requirements")
        .select("coupon_id, min_score, min_spend"),
      userEmail
        ? supabase
            .from("customer_coupon_claims")
            .select("coupon_id, used")
            .eq("email", userEmail)
        : Promise.resolve({ data: [] as Array<{ coupon_id: string; used: boolean }> }),
    ])
      .then(([couponResponse, requirementResponse, claimsResponse]) => {
        if (!mounted) {
          return;
        }

        const couponData = (couponResponse.data ?? []) as CouponWithRequirement[];
        const requirementMap = new Map(
          (requirementResponse.data ?? []).map((entry) => [
            entry.coupon_id,
            {
              min_score: Number(entry.min_score ?? 0),
              min_spend: Number(entry.min_spend ?? 0),
            },
          ]),
        );
        const claimSet = new Set(
          (claimsResponse.data ?? []).map((entry) => String(entry.coupon_id)),
        );

        const hydrated = couponData.map((coupon) => ({
          ...coupon,
          requirement: requirementMap.get(coupon.id),
          claimed: claimSet.has(coupon.id),
        }));

        setCoupons(hydrated);
      })
      .catch(() => {
        if (mounted) {
          setCoupons([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingCoupons(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [authReady, userEmail]);

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
    localStorage.setItem(settingsStorageKey, JSON.stringify({ ...next, ...preferences }));
  };

  const handlePreferenceChange = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K],
  ) => {
    const next = {
      ...preferences,
      [key]: value,
    };
    setPreferences(next);
    localStorage.setItem(settingsStorageKey, JSON.stringify({ ...alerts, ...next }));
  };

  const removeWishlistItem = (productId: string, productSlug?: string | null) => {
    const next = wishlist.filter(
      (item) => item.product_id !== productId && (!productSlug || item.slug !== productSlug),
    );
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
            { id: "preferences", label: locale === "ar" ? "التفضيلات" : "Preferences" },
            { id: "points", label: locale === "ar" ? "النقاط والنتائج" : "Points & Score" },
            { id: "coupons", label: locale === "ar" ? "كوبوناتك" : "My Coupons" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "profile" | "settings" | "preferences" | "points" | "coupons")}
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

        {activeTab === "preferences" && (
          <div className="grid gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
            <div>
              <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Delivery Preferences</h2>
              <p className="mt-1 text-xs text-sand/60">Customize how you receive your orders</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-sand/80 mb-3">Delivery Speed</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { value: "standard", label: "Standard (3-5 days)" },
                  { value: "express", label: "Express (1-2 days)" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${
                      preferences.deliverySpeed === option.value
                        ? "border-gold/60 bg-gold/10"
                        : "border-gold/20 bg-obsidian/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_speed"
                      checked={preferences.deliverySpeed === option.value}
                      onChange={() =>
                        handlePreferenceChange(
                          "deliverySpeed",
                          option.value as "standard" | "express",
                        )
                      }
                      className="h-4 w-4 accent-gold"
                    />
                    <span className="text-sm text-sand">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-sand/80 mb-3">Preferred Delivery Time</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { value: "morning", label: "Morning (8 AM - 12 PM)" },
                  { value: "afternoon", label: "Afternoon (12 PM - 5 PM)" },
                  { value: "evening", label: "Evening (5 PM - 10 PM)" },
                  { value: "anytime", label: "Anytime" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${
                      preferences.preferredDeliveryTime === option.value
                        ? "border-gold/60 bg-gold/10"
                        : "border-gold/20 bg-obsidian/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_time"
                      checked={preferences.preferredDeliveryTime === option.value}
                      onChange={() =>
                        handlePreferenceChange(
                          "preferredDeliveryTime",
                          option.value as "morning" | "afternoon" | "evening" | "anytime",
                        )
                      }
                      className="h-4 w-4 accent-gold"
                    />
                    <span className="text-sm text-sand">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-gold/20 pt-4">
              <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Product Preferences</h2>
              <p className="mt-1 text-xs text-sand/60">Tell us which categories you prefer</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-sand/80 mb-3">Interested Categories</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {["summer", "winter", "casual", "formal", "sports", "accessories"].map((cat) => (
                  <label
                    key={cat}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${
                      preferences.preferredCategories.includes(cat)
                        ? "border-gold/60 bg-gold/10"
                        : "border-gold/20 bg-obsidian/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={preferences.preferredCategories.includes(cat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handlePreferenceChange("preferredCategories", [
                            ...preferences.preferredCategories,
                            cat,
                          ]);
                        } else {
                          handlePreferenceChange(
                            "preferredCategories",
                            preferences.preferredCategories.filter((c) => c !== cat),
                          );
                        }
                      }}
                      className="h-4 w-4 accent-gold"
                    />
                    <span className="text-sm text-sand capitalize">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gold/20 bg-obsidian/40 px-4 py-3">
              <p className="text-xs text-sand/70">Your preferences help us show you more relevant products and promotions.</p>
            </div>
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
              <div>
                <h2 className="text-sm uppercase tracking-[0.3em] text-gold">Points History</h2>
                <p className="mt-1 text-xs text-sand/60">See how you earned your points</p>
              </div>
              {orders.length === 0 ? (
                <p className="mt-4 text-sm text-sand/60">No orders found.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {orders.slice(0, 10).map((order, idx) => {
                    const orderPoints = calculatePoints(Number(order.total ?? 0));
                    return (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-gold/20 bg-obsidian/40 px-4 py-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-sand">Order {String(order.reference_number || "").slice(0, 8)}</span>
                            <span className="text-xs text-sand/60">{order.order_date ? new Date(order.order_date).toLocaleDateString() : ""}</span>
                          </div>
                          <div className="mt-1 text-xs text-sand/60">
                            Spent {formatCurrency(Number(order.total ?? 0), "en")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gold">+{orderPoints}</div>
                          <div className="text-xs text-sand/60">points</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {loadingCoupons ? (
              <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel text-sm text-sand/60">
                Loading coupons...
              </div>
            ) : (
              <CouponClaim
                coupons={coupons}
                customerEmail={userEmail}
                customerScore={score}
                customerTotalSpend={totalSpend}
              />
            )}

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
                    <div key={item.product_id} className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-obsidian/60 p-3">
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
                        onClick={() => removeWishlistItem(item.product_id, item.slug)}
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

        {activeTab === "coupons" && (
          <div className="grid gap-6">
            {loadingCoupons ? (
              <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel text-sm text-sand/60">
                {locale === "ar" ? "جاري تحميل الكوبونات..." : "Loading coupons..."}
              </div>
            ) : coupons.length === 0 ? (
              <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel text-center">
                <p className="text-sm text-sand/60">{locale === "ar" ? "لا توجد كوبونات متاحة حالياً" : "No coupons available at this moment"}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
                  <h2 className="text-sm uppercase tracking-[0.3em] text-gold mb-4">
                    {locale === "ar" ? "كوبوناتك المتاحة" : "Available Coupons"}
                  </h2>
                  <div className="space-y-3">
                    {coupons.filter((c) => !c.claimed).length === 0 ? (
                      <p className="text-sm text-sand/60">{locale === "ar" ? "لم تستخدم أي كوبونات بعد" : "You haven't claimed any coupons yet"}</p>
                    ) : (
                      coupons.filter((c) => !c.claimed).map((coupon) => (
                        <div
                          key={coupon.id}
                          className="flex items-center justify-between gap-4 rounded-lg p-4 border bg-gold/10 border-gold/30"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-gold">
                                {coupon.code}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                coupon.type === "percent"
                                  ? "bg-gold/20 text-gold"
                                  : "bg-sand/20 text-sand"
                              }`}>
                                {coupon.type === "percent" ? `${coupon.value}%` : formatCurrency(coupon.value, locale)}
                              </span>
                            </div>
                            {coupon.min_subtotal && (
                              <p className="text-xs text-sand/60 mt-1">
                                {locale === "ar" ? "الحد الأدنى: " : "Min: "}
                                {formatCurrency(coupon.min_subtotal, locale)}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
                          >
                            {locale === "ar" ? "استخدام" : "Claim"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {coupons.filter((c) => c.claimed).length > 0 && (
                  <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel">
                    <h2 className="text-sm uppercase tracking-[0.3em] text-gold mb-4">
                      {locale === "ar" ? "كوبوناتك المستخدمة" : "Used Coupons"}
                    </h2>
                    <div className="space-y-3">
                      {coupons.filter((c) => c.claimed).map((coupon) => (
                        <div
                          key={coupon.id}
                          className="flex items-center justify-between gap-4 rounded-lg p-4 border bg-obsidian/30 border-sand/20"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-gold">
                                {coupon.code}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                coupon.type === "percent"
                                  ? "bg-gold/20 text-gold"
                                  : "bg-sand/20 text-sand"
                              }`}>
                                {coupon.type === "percent" ? `${coupon.value}%` : formatCurrency(coupon.value, locale)}
                              </span>
                            </div>
                            {coupon.min_subtotal && (
                              <p className="text-xs text-sand/60 mt-1">
                                {locale === "ar" ? "الحد الأدنى: " : "Min: "}
                                {formatCurrency(coupon.min_subtotal, locale)}
                              </p>
                            )}
                          </div>
                          <div className="rounded-full border border-gold/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
                            {locale === "ar" ? "مستخدم" : "Claimed"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-stone/80 p-4 temple-panel">
      <div className="text-xs uppercase tracking-[0.25em] text-gold/70">{label}</div>
      <div className="mt-2 text-xl font-semibold text-sand">{value}</div>
    </div>
  );
}
