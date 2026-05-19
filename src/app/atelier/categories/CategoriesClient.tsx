"use client";

import { useState } from "react";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import AdminAlert from "@/components/AdminAlert";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import type { Category } from "@/lib/types";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  logoutAdmin,
} from "../actions";

type CategoriesClientProps = {
  token: string;
  isAuthorized: boolean;
  envReady: boolean;
  flash?: {
    code?: string;
    kind?: "success" | "error" | "info";
  } | null;
  categories: Category[];
};

export default function CategoriesClient({
  token,
  isAuthorized,
  envReady,
  flash,
  categories,
}: CategoriesClientProps) {
  const { locale } = useLanguage();
  const labels = copy[locale].admin;
  const isArabic = locale === "ar";
  const [editingId, setEditingId] = useState<string | null>(null);

  const flashMessage = flash?.code
    ? labels.flash[flash.code as keyof typeof labels.flash] ?? flash.code
    : "";

  if (!isAuthorized) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-20">
        <div className="rounded-3xl border border-gold/20 bg-stone/80 p-8 text-center text-sand">
          {labels.unauthorized}
        </div>
      </main>
    );
  }

  if (!envReady) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-sand/70">
        {labels.envMissing}
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <Link href={`/atelier?admin_token=${encodeURIComponent(token)}`}>
          <button className="text-sm text-gold/70 hover:text-gold">
            ← {labels.back}
          </button>
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
            {labels.manageCategories}
          </h1>
          <p className="mt-2 text-sm text-sand/70">
            {labels.categoriesDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <form action={logoutAdmin}>
            <button className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {labels.signOut}
            </button>
          </form>
        </div>
      </div>

      {flashMessage && (
        <AdminAlert
          type={flash?.kind ?? "info"}
          message={flashMessage}
          dismissible={true}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          action={createCategory}
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6"
        >
          <input type="hidden" name="admin_token" value={token} />
          <h2 className="font-display text-xl tracking-[0.2em] text-gold">
            {labels.createCategory}
          </h2>

          <input
            name="name_en"
            placeholder={labels.nameEn}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            required
          />
          <input
            name="name_ar"
            placeholder={labels.nameAr}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            required
          />

          <select
            name="type"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="collection">{labels.collection}</option>
            <option value="brand">{labels.brand}</option>
            <option value="style">{labels.style}</option>
            <option value="occasion">{labels.occasion}</option>
          </select>

          <select
            name="parent_category_id"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">{labels.noParent}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {isArabic ? cat.name_ar : cat.name_en}
              </option>
            ))}
          </select>

          <select
            name="season"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          >
            <option value="">
              {labels.noSeason}
            </option>
            <option value="summer">{labels.seasonal}</option>
            <option value="winter">{labels.seasonal}</option>
          </select>

          <input
            name="slug"
            placeholder={labels.slugOptional}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />

          <textarea
            name="description_en"
            placeholder={`${labels.descriptionEN}`}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            rows={2}
          />

          <textarea
            name="description_ar"
            placeholder={`${labels.descriptionAR}`}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            rows={2}
          />

          <input
            name="icon_url"
            placeholder={labels.iconURL}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />

          <input
            name="sort_order"
            type="number"
            placeholder={labels.sortOrder}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />

          <button
            type="submit"
            className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
          >
            {labels.create}
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <h3 className="font-display text-xl tracking-[0.2em] text-gold">
            {labels.categories} ({categories.length})
          </h3>
          <div className="flex max-h-[600px] flex-col gap-3 overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-2xl border border-gold/15 bg-stone/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gold">
                      {isArabic ? category.name_ar : category.name_en}
                    </h4>
                    <p className="mt-1 text-xs text-sand/60">
                      {category.type} {category.season && `• ${category.season}`}
                    </p>
                    {category.description_en && (
                      <p className="mt-2 text-xs text-sand/50 line-clamp-2">
                        {isArabic ? category.description_ar : category.description_en}
                      </p>
                    )}
                  </div>
                  <form action={deleteCategory} className="flex gap-2">
                    <input type="hidden" name="admin_token" value={token} />
                    <input type="hidden" name="category_id" value={category.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-300 hover:bg-red-950/40"
                    >
                      {isArabic ? "حذف" : "Delete"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="rounded-2xl border border-gold/10 bg-stone/20 p-4 text-center text-sm text-sand/50">
                {isArabic ? "لا توجد مجموعات بعد" : "No categories yet"}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
