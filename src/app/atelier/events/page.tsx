import EventsClient from "./EventsClient";
import { verifyAdminToken } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Event } from "@/lib/types";

async function getEvents(): Promise<Event[]> {
  const supabase = getSupabaseAdmin();
  const { data: events } = await supabase
    .from("events")
    .select("id, name_en, name_ar, slug, event_type, description_en, description_ar, icon_url, banner_url, start_date, end_date, is_active, sort_order, created_at")
    .order("sort_order", { ascending: true });
  return events ?? [];
}

type EventsPageProps = {
  searchParams?: {
    admin_token?: string;
    flash?: string;
    kind?: "success" | "error" | "info";
  };
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const token = searchParams?.admin_token ?? "";
  const isAuthorized = verifyAdminToken(token);
  const envReady =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const events = isAuthorized && envReady ? await getEvents() : [];

  return (
    <EventsClient
      token={token}
      isAuthorized={isAuthorized}
      envReady={Boolean(envReady)}
      flash={searchParams?.flash ? { code: searchParams.flash, kind: searchParams.kind ?? "info" } : null}
      events={events}
    />
  );
}
