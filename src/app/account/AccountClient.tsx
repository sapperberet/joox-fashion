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
  const { locale } = useLanguage();
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
      setProfile(profileFromMeta);
      setUserEmail(data.session.user.email ?? "");
      const stored = localStorage.getItem(settingsStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.orderUpdates !== undefined) setAlerts(parsed);
        if (parsed.deliverySpeed !== undefined) setPreferences(parsed);
      }
      setAuthReady(true);
    });
  }, [router]);

  const totalSpend = useMemo(() => orders.reduce((sum, o) => sum + (o.total || 0), 0), [orders]);
  const points = useMemo(() => calculatePoints(totalSpend), [totalSpend]);
  const score = useMemo(() => calculateScore(points, orders.length), [points, orders.length]);
  const tier = score >= 500 ? "Gold" : score >= 250 ? "Silver" : "Bronze";
  const wishlistCount = wishlist.length;

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    try {
      await supabase.auth.updateUser({
        data: {
          fullName: profile.fullName,
          phone: profile.phone,
          city: profile.city,
          address: profile.address,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const handleSettingChange = (key: keyof typeof alerts, checked: boolean) => {
    const next = { ...alerts, [key]: checked };
    setAlerts(next);
    localStorage.setItem(settingsStorageKey, JSON.stringify({ ...next, ...preferences }));
  };

  const handlePreferenceChange = <K extends keyof typeof preferences>(key: K, value: typeof preferences[K]) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem(settingsStorageKey, JSON.stringify({ ...alerts, ...next }));
  };

  const removeWishlistItem = (productId: string, productSlug?: string | null) => {
    const next = wishlist.filter((item) => item.product_id !== productId && (!productSlug || item.slug !== productSlug));
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
          {["profile", "settings", "preferences", "points", "coupons"].map((tabId) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId as any)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                activeTab === tabId
                  ? "bg-gold text-ink font-semibold"
                  : "border border-gold/30 text-gold hover:bg-gold/10"
              }`}
            >
              {tabId === "preferences"
                ? locale === "ar"
                  ? "التفضيلات"
                  : "Preferences"
                : tabId === "points"
                  ? locale === "ar"
                    ? "النقاط والنتائج"
                    : "Points & Score"
                  : tabId === "coupons"
                    ? locale === "ar"
                      ? "كوبوناتك"
                      : "My Coupons"
                    : tabId.charAt(0).toUpperCase() + tabId.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel space-y-4">
            <h2 className="text-lg font-semibold text-gold">Profile Information</h2>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              placeholder="Full Name"
              className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sand"
            />
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sand/60"
            />
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Phone"
              className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sand"
            />
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="City"
              className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sand"
            />
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Address"
              className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sand"
            />
            <button
              type="submit"
              className="w-full rounded bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90"
            >
              Save Changes
            </button>
            {saved && <p className="text-sm text-emerald-400">Profile saved successfully!</p>}
          </form>
        )}

        {activeTab === "settings" && (
          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel space-y-4">
            <h2 className="text-lg font-semibold text-gold">Notification Settings</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={alerts.orderUpdates}
                onChange={(e) => handleSettingChange("orderUpdates", e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-sand">Order Updates</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={alerts.promotions}
                onChange={(e) => handleSettingChange("promotions", e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-sand">Promotions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={alerts.whatsapp}
                onChange={(e) => handleSettingChange("whatsapp", e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              <span className="text-sand">WhatsApp Notifications</span>
            </label>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel space-y-4">
            <h2 className="text-lg font-semibold text-gold">Delivery Preferences</h2>
            <div>
              <label className="text-sm text-sand/80">Delivery Speed</label>
              <select
                value={preferences.deliverySpeed}
                onChange={(e) => handlePreferenceChange("deliverySpeed", e.target.value as any)}
                className="w-full mt-2 rounded border border-gold/20 bg-obsidian px-3 py-2 text-sand"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-sand/80">Preferred Delivery Time</label>
              <select
                value={preferences.preferredDeliveryTime}
                onChange={(e) => handlePreferenceChange("preferredDeliveryTime", e.target.value as any)}
                className="w-full mt-2 rounded border border-gold/20 bg-obsidian px-3 py-2 text-sand"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-sand/80">Interested Categories</label>
              <div className="grid gap-2 sm:grid-cols-3 mt-2">
                {["summer", "winter", "casual", "formal", "sports", "accessories"].map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.preferredCategories.includes(cat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handlePreferenceChange("preferredCategories", [...preferences.preferredCategories, cat]);
                        } else {
                          handlePreferenceChange(
                            "preferredCategories",
                            preferences.preferredCategories.filter((c) => c !== cat)
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
          </div>
        )}

        {activeTab === "points" && (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gold/20 bg-stone/80 p-4 text-center">
                <div className="text-3xl font-bold text-gold">{orders.length}</div>
                <div className="text-xs text-sand/60">Orders</div>
              </div>
              <div className="rounded-2xl border border-gold/20 bg-stone/80 p-4 text-center">
                <div className="text-3xl font-bold text-gold">{formatCurrency(totalSpend, "en")}</div>
                <div className="text-xs text-sand/60">Spend</div>
              </div>
              <div className="rounded-2xl border border-gold/20 bg-stone/80 p-4 text-center">
                <div className="text-3xl font-bold text-gold">{points}</div>
                <div className="text-xs text-sand/60">Points</div>
              </div>
              <div className="rounded-2xl border border-gold/20 bg-stone/80 p-4 text-center">
                <div className="text-3xl font-bold text-gold">{tier}</div>
                <div className="text-xs text-sand/60">Tier</div>
              </div>
            </div>
            <div className="rounded-2xl border border-gold/20 bg-stone/80 p-6">
              <h3 className="font-semibold text-gold mb-4">Wishlist ({wishlist.length})</h3>
              {wishlist.length === 0 ? (
                <p className="text-sm text-sand/60">No saved products</p>
              ) : (
                <div className="space-y-3">
                  {wishlist.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between rounded p-2 border border-gold/20">
                      <div>
                        <div className="text-sm font-semibold text-sand">{item.name_en}</div>
                        <div className="text-xs text-sand/60">{formatCurrency(item.price, "en")}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWishlistItem(item.product_id, item.slug)}
                        className="text-xs text-gold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "coupons" && (
          <div className="rounded-3xl border border-gold/20 bg-stone/80 p-6 temple-panel space-y-4">
            <h2 className="text-lg font-semibold text-gold">My Coupons</h2>
            {loadingCoupons ? (
              <p className="text-sand/60">Loading coupons...</p>
            ) : coupons.length === 0 ? (
              <p className="text-sand/60">No coupons available</p>
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="flex items-center justify-between rounded-lg p-4 border border-gold/20 bg-obsidian/50">
                    <div>
                      <div className="font-mono font-bold text-gold">{coupon.code}</div>
                      <div className="text-xs text-sand/60">
                        {coupon.type === "percent" ? `${coupon.value}%` : formatCurrency(coupon.value, locale)}
                        {coupon.claimed ? " - Used" : " - Available"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
