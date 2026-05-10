"use client";

import { useState } from "react";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";
import { setCouponRequirements, deleteCouponRequirements } from "./actions";

interface CouponRequirement {
  min_score: number;
  min_spend: number;
}

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_subtotal?: number;
  max_uses?: number;
  used_count?: number;
  is_active: boolean;
  requirement?: CouponRequirement;
}

interface CouponsClientProps {
  coupons: Coupon[];
  adminToken: string;
}

export default function CouponsClient({ coupons, adminToken }: CouponsClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleExpand = (couponId: string, existing?: CouponRequirement) => {
    if (expandedId === couponId) {
      setExpandedId(null);
    } else {
      setExpandedId(couponId);
      setFormData({
        [couponId]: {
          min_score: existing?.min_score ?? 0,
          min_spend: existing?.min_spend ?? 0,
        },
      });
    }
  };

  return (
    <div className="rounded-2xl border border-gold/20 bg-linear-to-br from-stone/90 to-stone/80 p-6 sm:p-8 temple-panel">
      <h2 className="mb-6 text-2xl font-bold text-gold">Manage Coupons</h2>

      {coupons.length === 0 ? (
        <p className="text-center text-sand/60 py-8">No coupons found</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {coupons.map((coupon) => {
            const isExpanded = expandedId === coupon.id;
            const current = formData[coupon.id] || {
              min_score: coupon.requirement?.min_score ?? 0,
              min_spend: coupon.requirement?.min_spend ?? 0,
            };

            return (
              <div
                key={coupon.id}
                className="rounded-lg border border-gold/20 bg-obsidian/40 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleExpand(coupon.id, coupon.requirement)}
                  className="w-full flex items-center justify-between gap-4 p-4 hover:bg-obsidian/60 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gold">
                        {coupon.code}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        coupon.type === "percent"
                          ? "bg-gold/20 text-gold"
                          : "bg-sand/20 text-sand"
                      }`}>
                        {coupon.type === "percent"
                          ? `${coupon.value}%`
                          : formatCurrency(coupon.value, locale)}
                      </span>
                      {coupon.max_uses && (
                        <span className="text-xs text-sand/60">
                          {coupon.used_count ?? 0} / {coupon.max_uses}
                        </span>
                      )}
                    </div>
                    {coupon.requirement && (
                      <p className="text-xs text-sand/60 mt-1">
                        Score: {coupon.requirement.min_score} | Spend:{" "}
                        {formatCurrency(coupon.requirement.min_spend, locale)}
                      </p>
                    )}
                  </div>
                  <span className="text-gold text-xl">
                    {isExpanded ? "−" : "+"}
                  </span>
                </button>

                {isExpanded && (
                  <form
                    action={setCouponRequirements}
                    className="border-t border-gold/20 p-4 bg-obsidian/20 space-y-4"
                  >
                    <input
                      type="hidden"
                      name="admin_token"
                      value={adminToken}
                    />
                    <input type="hidden" name="coupon_id" value={coupon.id} />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-1">
                          Min Score
                        </label>
                        <input
                          type="number"
                          name="min_score"
                          min={0}
                          value={current.min_score}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [coupon.id]: {
                                ...current,
                                min_score: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand focus:border-gold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-1">
                          Min Spend
                        </label>
                        <input
                          type="number"
                          name="min_spend"
                          min={0}
                          value={current.min_spend}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [coupon.id]: {
                                ...current,
                                min_spend: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 transition-all"
                      >
                        Save
                      </button>
                      {coupon.requirement && (
                        <form action={deleteCouponRequirements} className="inline">
                          <input
                            type="hidden"
                            name="admin_token"
                            value={adminToken}
                          />
                          <input
                            type="hidden"
                            name="coupon_id"
                            value={coupon.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition-all"
                          >
                            Clear
                          </button>
                        </form>
                      )}
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
