"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminAlert from "@/components/AdminAlert";
import AdminNavbar from "../AdminNavbar";
import { useLanguage } from "@/components/SiteProviders";
import { copy } from "@/lib/i18n";
import type { Event } from "@/lib/types";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "../actions";

type EventsClientProps = {
  token: string;
  isAuthorized: boolean;
  envReady: boolean;
  flash?: {
    code?: string;
    kind?: "success" | "error" | "info";
  } | null;
  events: Event[];
};

export default function EventsClient({
  token,
  isAuthorized,
  envReady,
  flash,
  events,
}: EventsClientProps) {
  const { locale } = useLanguage();
  const labels = copy[locale].admin;
  const isArabic = locale === "ar";
  const router = useRouter();

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
      <AdminNavbar token={token} isArabic={isArabic} />

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6">
        <Link href={`/atelier?admin_token=${encodeURIComponent(token)}`}>
          <button className="text-sm text-gold/70 hover:text-gold">
            ← {labels.back}
          </button>
        </Link>
        <div>
          <h1 className="font-display text-3xl tracking-[0.2em] text-gold">
            {labels.manageEvent}
          </h1>
          <p className="mt-2 text-sm text-sand/70">
            {labels.eventsDescription}
          </p>
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
          action={createEvent}
          className="flex flex-col gap-4 rounded-3xl border border-gold/20 bg-stone/80 p-6"
        >
          <input type="hidden" name="admin_token" value={token} />
          <h2 className="font-display text-xl tracking-[0.2em] text-gold">
            {labels.createEvent}
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
            name="event_type"
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            required
          >
            <option value="">{labels.selectType}</option>
            <option value="seasonal">{labels.seasonal}</option>
            <option value="promotional">{labels.promotional}</option>
            <option value="collection">{labels.collection}</option>
            <option value="collaboration">{labels.collaboration}</option>
            <option value="flash-sale">{labels.flashSale}</option>
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
            rows={3}
          />

          <textarea
            name="description_ar"
            placeholder={`${labels.descriptionAR}`}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            rows={3}
          />

          <input
            name="icon_url"
            placeholder={labels.iconURL}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />

          <input
            name="banner_url"
            placeholder={labels.bannerURL}
            className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              name="start_date"
              type="datetime-local"
              placeholder={labels.startDate}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
            <input
              name="end_date"
              type="datetime-local"
              placeholder={labels.endDate}
              className="rounded-2xl border border-gold/20 bg-obsidian px-4 py-3 text-sm text-sand"
            />
          </div>

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
            {labels.events} ({events.length})
          </h3>
          <div className="flex max-h-[600px] flex-col gap-3 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-gold/15 bg-stone/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gold">
                      {isArabic ? event.name_ar : event.name_en}
                    </h4>
                    <p className="mt-1 text-xs text-sand/60">
                      {event.event_type} {event.start_date && `• ${new Date(event.start_date).toLocaleDateString()}`}
                    </p>
                    {event.description_en && (
                      <p className="mt-2 text-xs text-sand/50 line-clamp-2">
                        {isArabic ? event.description_ar : event.description_en}
                      </p>
                    )}
                  </div>
                  <form action={deleteEvent} className="flex gap-2">
                    <input type="hidden" name="admin_token" value={token} />
                    <input type="hidden" name="event_id" value={event.id} />
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
            {events.length === 0 && (
              <p className="rounded-2xl border border-gold/10 bg-stone/20 p-4 text-center text-sm text-sand/50">
                {isArabic ? "لا توجد فعاليات بعد" : "No events yet"}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
