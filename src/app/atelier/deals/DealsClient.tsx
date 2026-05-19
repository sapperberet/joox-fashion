"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { getDealDescription } from "@/lib/deals";
import { createDeal, updateDeal, deleteDeal, toggleDealStatus } from "./actions";
import AdminNavbar from "../AdminNavbar";

interface Deal {
  id: string;
  name_en: string;
  name_ar: string;
  deal_type: "buy_x_get_y" | "buy_x_of_product_get_y_free";
  trigger_product_ids: string[] | null;
  applicable_product_ids: string[];
  buy_quantity: number;
  free_quantity: number;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  image_url?: string;
}

interface DealsClientProps {
  deals: Deal[];
  products: Product[];
  adminToken: string;
}

export default function DealsClient({ deals, products, adminToken }: DealsClientProps) {
  const { locale } = useLanguage();
  const t = copy[locale];
  const isArabic = locale === "ar";
  const labels = t.admin;
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    deal_type: "buy_x_get_y",
    buy_quantity: 2,
    free_quantity: 1,
    trigger_product_ids: [] as string[],
    applicable_product_ids: [] as string[],
  });

  const currentEditDeal = editingId ? deals.find((d) => d.id === editingId) : null;

  const handleReset = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name_en: "",
      name_ar: "",
      deal_type: "buy_x_get_y",
      buy_quantity: 2,
      free_quantity: 1,
      trigger_product_ids: [],
      applicable_product_ids: [],
    });
  };

  const handleEdit = (deal: Deal) => {
    setEditingId(deal.id);
    setFormData({
      name_en: deal.name_en,
      name_ar: deal.name_ar,
      deal_type: deal.deal_type,
      buy_quantity: deal.buy_quantity,
      free_quantity: deal.free_quantity,
      trigger_product_ids: (deal.trigger_product_ids as string[]) || [],
      applicable_product_ids: (deal.applicable_product_ids as string[]) || [],
    });
  };

  const isTriggerType = formData.deal_type === "buy_x_of_product_get_y_free";
  const hasValidApplicable = formData.applicable_product_ids.length > 0;
  const hasValidTrigger = !isTriggerType || formData.trigger_product_ids.length > 0;
  const canSubmit = formData.name_en && formData.name_ar && hasValidApplicable && hasValidTrigger;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <AdminNavbar token={adminToken} isArabic={isArabic} />

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <Link href={`/atelier?admin_token=${encodeURIComponent(adminToken)}`}>
          <button className="text-sm text-gold/70 hover:text-gold">
            ← {isArabic ? "العودة" : "Back"}
          </button>
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
            {isArabic ? "إدارة العروض" : "Deal Management"}
          </h1>
          <p className="mt-2 text-sm text-sand/70">
            {isArabic ? "أنشئ وأدر عروض شراء X والحصول على Y مجاني" : "Create and manage buy X get Y free deals"}
          </p>
        </div>
      </div>

      {!isCreating && !editingId && (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="w-full rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink hover:bg-gold/90 transition-all"
        >
          {isArabic ? "إنشاء عرض جديد" : "Create New Deal"}
        </button>
      )}

      {(isCreating || editingId) && (
        <form
          action={editingId ? updateDeal : createDeal}
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6"
        >
          <input type="hidden" name="admin_token" value={adminToken} />
          {editingId && <input type="hidden" name="deal_id" value={editingId} />}

          <h2 className="font-display text-xl tracking-[0.2em] text-gold">
            {editingId ? (isArabic ? "تحرير العرض" : "Edit Deal") : (isArabic ? "إنشاء عرض جديد" : "Create New Deal")}
          </h2>

          <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-4">
            <p className="text-xs text-sand/70 font-semibold mb-3">
              {isArabic ? "معلومات أساسية" : "Basic Information"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gold/70 mb-1">
                  {isArabic ? "الاسم (إنجليزي)" : "Name (English)"}
                </label>
                <input
                  type="text"
                  name="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g., Summer Promotion"
                  className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gold/70 mb-1">
                  {isArabic ? "الاسم (عربي)" : "Name (Arabic)"}
                </label>
                <input
                  type="text"
                  name="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="مثال: عرض الصيف"
                  className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                  required
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-4">
            <p className="text-xs text-sand/70 font-semibold mb-3">
              {isArabic ? "نوع العرض" : "Deal Type"}
            </p>
            <select
              name="deal_type"
              value={formData.deal_type}
              onChange={(e) => setFormData({ ...formData, deal_type: e.target.value })}
              className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            >
              <option value="buy_x_get_y">
                {isArabic ? "اشتري X واحصل على Y مجاني (أي منتجات)" : "Buy X Get Y Free (Any Products)"}
              </option>
              <option value="buy_x_of_product_get_y_free">
                {isArabic ? "اشتري X من منتج معين واحصل على Y مجاني" : "Buy X of Specific Product Get Y Free"}
              </option>
            </select>
            <p className="text-xs text-sand/50 mt-2">
              {isTriggerType
                ? isArabic
                  ? "حدد المنتجات التي يجب شراؤها لتفعيل العرض"
                  : "Select products that must be purchased to trigger the deal"
                : isArabic
                  ? "سيتم تطبيق العرض تلقائياً عند الشراء من المنتجات المختارة"
                  : "Deal applies automatically when buying selected products"}
            </p>
          </div>

          <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-4">
            <p className="text-xs text-sand/70 font-semibold mb-3">
              {isArabic ? "شروط العرض" : "Deal Conditions"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gold/70 mb-1">
                  {isArabic ? "عدد الشراء" : "Buy Quantity"}
                </label>
                <input
                  type="number"
                  name="buy_quantity"
                  min={1}
                  max={10}
                  value={formData.buy_quantity}
                  onChange={(e) => setFormData({ ...formData, buy_quantity: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                  required
                />
                <p className="text-xs text-sand/50 mt-1">
                  {isArabic ? "كم يجب أن يشتري العميل" : "How many items customer must buy"}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gold/70 mb-1">
                  {isArabic ? "عدد المجاني" : "Free Quantity"}
                </label>
                <input
                  type="number"
                  name="free_quantity"
                  min={1}
                  max={10}
                  value={formData.free_quantity}
                  onChange={(e) => setFormData({ ...formData, free_quantity: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
                  required
                />
                <p className="text-xs text-sand/50 mt-1">
                  {isArabic ? "كم يحصل على مجاني" : "How many free items customer gets"}
                </p>
              </div>
            </div>
          </div>

          {isTriggerType && (
            <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-4">
              <p className="text-xs text-sand/70 font-semibold mb-2">
                {isArabic ? "منتجات التفعيل (المطلوبة)" : "Trigger Products (Must Buy)"}
              </p>
              <p className="text-xs text-sand/50 mb-3">
                {isArabic
                  ? "حدد المنتجات التي يجب شراء العميل كميات منها لتفعيل هذا العرض"
                  : "Select which products, when purchased, trigger this deal"}
              </p>
              <div className="max-h-64 overflow-y-auto space-y-1 border border-gold/20 rounded-lg p-3 bg-obsidian/30">
                {products.length === 0 ? (
                  <p className="text-xs text-sand/50 py-4 text-center">
                    {isArabic ? "لا توجد منتجات" : "No products"}
                  </p>
                ) : (
                  products.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gold/5 rounded">
                      <input
                        type="checkbox"
                        name="trigger_product_ids"
                        value={product.id}
                        checked={formData.trigger_product_ids.includes(product.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...formData.trigger_product_ids, product.id]
                            : formData.trigger_product_ids.filter((id) => id !== product.id);
                          setFormData({ ...formData, trigger_product_ids: newIds });
                        }}
                        className="rounded"
                      />
                      <span className="text-xs text-sand">
                        {isArabic ? product.name_ar : product.name_en}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {!hasValidTrigger && (
                <p className="text-xs text-red-400 mt-2">
                  {isArabic ? "يرجى تحديد منتج واحد على الأقل" : "Please select at least one product"}
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-4">
            <p className="text-xs text-sand/70 font-semibold mb-2">
              {isArabic ? "المنتجات المطبقة (المجانية)" : "Applicable Products (Get Free)"}
            </p>
            <p className="text-xs text-sand/50 mb-3">
              {isArabic
                ? "حدد المنتجات التي يمكن أن يحصل عليها العميل مجاناً"
                : "Select which products can be obtained for free through this deal"}
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1 border border-gold/20 rounded-lg p-3 bg-obsidian/30">
              {products.length === 0 ? (
                <p className="text-xs text-sand/50 py-4 text-center">
                  {isArabic ? "لا توجد منتجات" : "No products"}
                </p>
              ) : (
                products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gold/5 rounded">
                    <input
                      type="checkbox"
                      name="applicable_product_ids"
                      value={product.id}
                      checked={formData.applicable_product_ids.includes(product.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...formData.applicable_product_ids, product.id]
                          : formData.applicable_product_ids.filter((id) => id !== product.id);
                        setFormData({ ...formData, applicable_product_ids: newIds });
                      }}
                      className="rounded"
                    />
                    <span className="text-xs text-sand">
                      {isArabic ? product.name_ar : product.name_en}
                    </span>
                  </label>
                ))
              )}
            </div>
            {!hasValidApplicable && (
              <p className="text-xs text-red-400 mt-2">
                {isArabic ? "يرجى تحديد منتج واحد على الأقل" : "Please select at least one product"}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink hover:bg-gold/90 transition-all disabled:bg-sand/20 disabled:text-sand/50"
            >
              {editingId ? (isArabic ? "تحديث" : "Update") : (isArabic ? "إنشاء" : "Create")}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-gold/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        <h3 className="font-display text-xl tracking-[0.2em] text-gold">
          {isArabic ? "العروض النشطة" : "Active Deals"} ({deals.filter((d) => d.is_active).length}/{deals.length})
        </h3>
        {deals.length === 0 ? (
          <div className="rounded-2xl border border-gold/15 bg-obsidian/40 p-8 text-center">
            <p className="text-sand/50">
              {isArabic ? "لا توجد عروض بعد" : "No deals yet"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className={`rounded-2xl border p-4 ${
                  deal.is_active
                    ? "border-gold/20 bg-stone/40"
                    : "border-sand/20 bg-obsidian/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gold">
                      {isArabic ? deal.name_ar : deal.name_en}
                    </h4>
                    <p className="text-xs text-sand/60 mt-1">
                      {getDealDescription(deal as Deal, locale as "en" | "ar")}
                    </p>
                    <div className="text-xs text-sand/50 mt-2 space-y-1">
                      <p>
                        {isArabic ? "المنتجات المطبقة:" : "Applicable:"} {(deal.applicable_product_ids as string[])?.length || 0}{" "}
                        {isArabic ? "منتج" : "products"}
                      </p>
                      {deal.deal_type === "buy_x_of_product_get_y_free" && (
                        <p>
                          {isArabic ? "منتجات التفعيل:" : "Triggers:"} {(deal.trigger_product_ids as string[])?.length || 0}{" "}
                          {isArabic ? "منتج" : "products"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <form action={toggleDealStatus} className="inline">
                      <input type="hidden" name="admin_token" value={adminToken} />
                      <input type="hidden" name="deal_id" value={deal.id} />
                      <input type="hidden" name="is_active" value={deal.is_active ? "true" : "false"} />
                      <button
                        type="submit"
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          deal.is_active
                            ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                            : "bg-sand/20 text-sand/60 hover:bg-sand/30"
                        }`}
                      >
                        {deal.is_active ? (isArabic ? "نشط" : "Active") : (isArabic ? "معطل" : "Inactive")}
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => handleEdit(deal)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-gold/20 text-gold hover:bg-gold/30"
                    >
                      {isArabic ? "تحرير" : "Edit"}
                    </button>
                    <form action={deleteDeal} className="inline">
                      <input type="hidden" name="admin_token" value={adminToken} />
                      <input type="hidden" name="deal_id" value={deal.id} />
                      <button
                        type="submit"
                        className="w-full px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      >
                        {isArabic ? "حذف" : "Delete"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
