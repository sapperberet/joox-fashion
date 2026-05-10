"use client";

import { useState } from "react";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import { createDeal, updateDeal, deleteDeal, toggleDealStatus } from "./actions";

interface Deal {
  id: string;
  name_en: string;
  name_ar: string;
  deal_type: string;
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

  return (
    <div className="rounded-2xl border border-gold/20 bg-linear-to-br from-stone/90 to-stone/80 p-6 sm:p-8 temple-panel">
      <h2 className="mb-6 text-2xl font-bold text-gold">
        {editingId ? "Edit Deal" : "Buy 2 Get 1 Free Deals"}
      </h2>

      {!isCreating && !editingId && (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="mb-6 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 transition-all duration-300"
        >
          Create New Deal
        </button>
      )}

      {(isCreating || editingId) && (
        <form
          action={editingId ? updateDeal : createDeal}
          className="mb-8 space-y-4 rounded-lg border border-gold/20 bg-obsidian/30 p-4"
        >
          <input type="hidden" name="admin_token" value={adminToken} />
          {editingId && <input type="hidden" name="deal_id" value={editingId} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-1">
                Name (EN)
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand placeholder-sand/40 focus:border-gold focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-1">
                Name (AR)
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand placeholder-sand/40 focus:border-gold focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-1">
              Deal Type
            </label>
            <select
              name="deal_type"
              value={formData.deal_type}
              onChange={(e) => setFormData({ ...formData, deal_type: e.target.value })}
              className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand focus:border-gold focus:outline-none"
            >
              <option value="buy_x_get_y">Buy X Get Y Free (Any Products)</option>
              <option value="buy_x_of_product_get_y_free">Buy X of Specific Product Get Y Free</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-1">
                Buy Quantity
              </label>
              <input
                type="number"
                name="buy_quantity"
                min={1}
                value={formData.buy_quantity}
                onChange={(e) => setFormData({ ...formData, buy_quantity: parseInt(e.target.value) })}
                className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand focus:border-gold focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-1">
                Free Quantity
              </label>
              <input
                type="number"
                name="free_quantity"
                min={1}
                value={formData.free_quantity}
                onChange={(e) => setFormData({ ...formData, free_quantity: parseInt(e.target.value) })}
                className="w-full rounded border border-gold/20 bg-obsidian px-3 py-2 text-sm text-sand focus:border-gold focus:outline-none"
                required
              />
            </div>
          </div>

          {formData.deal_type === "buy_x_of_product_get_y_free" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-2">
                Trigger Products (Buy these)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gold/20 rounded p-2">
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 cursor-pointer">
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
                      {locale === "ar" ? product.name_ar : product.name_en}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gold/80 mb-2">
              Applicable Products (Get free)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-gold/20 rounded p-2">
              {products.map((product) => (
                <label key={product.id} className="flex items-center gap-2 cursor-pointer">
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
                    {locale === "ar" ? product.name_ar : product.name_en}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 transition-all duration-300"
            >
              {editingId ? "Update Deal" : "Create Deal"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gold/30 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {deals.length === 0 ? (
          <p className="text-center text-sand/60 py-8">No deals yet</p>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-gold/20 bg-obsidian/40 p-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-gold">
                  {locale === "ar" ? deal.name_ar : deal.name_en}
                </div>
                <div className="text-xs text-sand/60 mt-1">
                  {deal.deal_type === "buy_x_of_product_get_y_free"
                    ? `Buy ${deal.buy_quantity} specific product get ${deal.free_quantity} free`
                    : `Buy ${deal.buy_quantity} get ${deal.free_quantity} free`}
                </div>
                <div className="text-xs text-sand/50 mt-2">
                  Applicable: {(deal.applicable_product_ids as string[])?.length || 0} products
                </div>
              </div>

              <div className="flex items-center gap-2">
                <form action={toggleDealStatus} className="inline">
                  <input type="hidden" name="admin_token" value={adminToken} />
                  <input type="hidden" name="deal_id" value={deal.id} />
                  <input type="hidden" name="is_active" value={deal.is_active ? "true" : "false"} />
                  <button
                    type="submit"
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all duration-300 ${
                      deal.is_active
                        ? "bg-green-500/20 text-green-200 hover:bg-green-500/30"
                        : "bg-sand/20 text-sand/60 hover:bg-sand/30"
                    }`}
                  >
                    {deal.is_active ? "Active" : "Inactive"}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => handleEdit(deal)}
                  className="px-3 py-1 rounded text-xs font-semibold bg-gold/20 text-gold hover:bg-gold/30 transition-all duration-300"
                >
                  Edit
                </button>
                <form action={deleteDeal} className="inline">
                  <input type="hidden" name="admin_token" value={adminToken} />
                  <input type="hidden" name="deal_id" value={deal.id} />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-all duration-300"
                    onClick={(e) => {
                      if (!confirm("Delete this deal?")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
