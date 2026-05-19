"use client";

import { useState } from "react";
import { useLanguage } from "./SiteProviders";
import { copy } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format";

interface CouponRequirement {
  min_score: number;
  min_spend: number;
}

interface CouponWithRequirement {
  id: string;
  code: string;
  type: string;
  value: number;
  min_subtotal?: number;
  max_uses?: number;
  used_count?: number;
  is_active: boolean;
  requirement?: CouponRequirement;
  claimed?: boolean;
}

interface CouponClaimProps {
  coupons: CouponWithRequirement[];
  customerEmail?: string;
  customerScore?: number;
  customerTotalSpend?: number;
}

export default function CouponClaim({
  coupons,
  customerEmail,
  customerScore = 0,
  customerTotalSpend = 0,
}: CouponClaimProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(new Set<string>());

  const handleClaim = async (couponId: string) => {
    if (!customerEmail) {
      return;
    }

    setClaiming(couponId);
    try {
      const formData = new FormData();
      formData.append("coupon_id", couponId);
      formData.append("email", customerEmail);

      const response = await fetch("/api/coupons/claim", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setClaimed(new Set([...claimed, couponId]));
      }
    } catch (error) {
      console.error("Failed to claim coupon:", error);
    } finally {
      setClaiming(null);
    }
  };

  const meetsRequirements = (coupon: CouponWithRequirement) => {
    if (!coupon.requirement) return true;
    return (
      customerScore >= coupon.requirement.min_score &&
      customerTotalSpend >= coupon.requirement.min_spend
    );
  };

  const canClaimMore = (coupon: CouponWithRequirement) => {
    if (!coupon.max_uses) return true;
    return (coupon.used_count ?? 0) < coupon.max_uses;
  };

  return (
    <div className="rounded-2xl border border-gold/20 bg-linear-to-br from-stone/90 to-stone/80 p-6 sm:p-8 temple-panel">
      <h3 className="text-lg font-bold text-gold mb-4">
        {locale === "ar" ? "كوبونات متاحة" : "Available Coupons"}
      </h3>

      {coupons.length === 0 ? (
        <p className="text-sm text-sand/60">
          {locale === "ar" ? "لا توجد كوبونات متاحة حالياً" : "No coupons available at the moment"}
        </p>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const meets = meetsRequirements(coupon);
            const canClaim = canClaimMore(coupon);
            const hasClaimed = claimed.has(coupon.id) || Boolean(coupon.claimed);

            return (
              <div
                key={coupon.id}
                className={`flex items-center justify-between gap-4 rounded-lg p-4 border ${
                  meets && canClaim
                    ? "bg-gold/10 border-gold/30"
                    : "bg-obsidian/30 border-sand/20"
                }`}
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
                  {coupon.requirement && (
                    <div className="text-xs text-sand/50 mt-2 space-y-0.5">
                      {coupon.requirement.min_score > 0 && (
                        <p>
                          {locale === "ar" ? "النقاط المطلوبة: " : "Required Score: "}
                          <span className={customerScore >= coupon.requirement.min_score ? "text-green-400" : "text-red-400"}>
                            {customerScore}/{coupon.requirement.min_score}
                          </span>
                        </p>
                      )}
                      {coupon.requirement.min_spend > 0 && (
                        <p>
                          {locale === "ar" ? "الحد الأدنى للإنفاق: " : "Min Spend: "}
                          <span className={customerTotalSpend >= coupon.requirement.min_spend ? "text-green-400" : "text-red-400"}>
                            {formatCurrency(customerTotalSpend, locale)}/{formatCurrency(coupon.requirement.min_spend, locale)}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                  {coupon.max_uses && (
                    <p className="text-xs text-sand/50 mt-1">
                      {locale === "ar" ? "الاستخدامات المتبقية: " : "Uses left: "}
                      {coupon.max_uses - (coupon.used_count ?? 0)} / {coupon.max_uses}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!meets || !canClaim || hasClaimed || claiming === coupon.id || !customerEmail}
                  onClick={() => handleClaim(coupon.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-[0.1em] transition-all ${
                    hasClaimed
                      ? "bg-green-500/20 text-green-300 cursor-default"
                      : meets && canClaim
                      ? "bg-gold text-ink hover:bg-gold/90 cursor-pointer"
                      : "bg-sand/20 text-sand/40 cursor-not-allowed"
                  }`}
                >
                  {claiming === coupon.id
                    ? "..."
                    : hasClaimed
                    ? locale === "ar" ? "تم الحصول عليه" : "Claimed"
                    : !meets
                    ? locale === "ar" ? "غير مؤهل" : "Ineligible"
                    : !canClaim
                    ? locale === "ar" ? "مستنفد" : "Expired"
                    : locale === "ar" ? "احصل عليه" : "Claim"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
