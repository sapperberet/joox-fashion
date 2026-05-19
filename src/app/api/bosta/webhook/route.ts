import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type BostaPayload = {
  data?: Record<string, unknown> | null;
  delivery?: Record<string, unknown> | null;
  state?: unknown;
  trackingNumber?: unknown;
  businessReference?: unknown;
  error?: unknown;
  message?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNestedString(record: Record<string, unknown> | null | undefined, key: string) {
  if (!record) {
    return "";
  }
  return readString(record[key]);
}

function getStateValue(payload: BostaPayload, data: Record<string, unknown>) {
  const direct = readString(payload.state);
  if (direct) {
    return direct;
  }
  const fromData = data.state as { value?: unknown } | undefined;
  if (fromData && typeof fromData === "object" && "value" in fromData) {
    return readString(fromData.value);
  }
  return readString((data.state as unknown) ?? "");
}

function normalizeState(state: string) {
  return state.trim().toLowerCase().replace(/\s+/g, "_");
}

function mapShippingState(rawState: string) {
  const value = normalizeState(rawState);
  if (!value) {
    return "pending";
  }
  if (value.includes("deliver")) {
    return "delivered";
  }
  if (value.includes("transit") || value.includes("out_for_delivery")) {
    return "in_transit";
  }
  if (value.includes("fail") || value.includes("cancel") || value.includes("return")) {
    return "failed";
  }
  if (value.includes("create") || value.includes("pending") || value.includes("new") || value.includes("pickup")) {
    return "created";
  }
  return "pending";
}

function mapOrderStatus(shippingState: string) {
  if (shippingState === "delivered") {
    return "delivered";
  }
  if (shippingState === "in_transit") {
    return "shipped";
  }
  if (shippingState === "created") {
    return "packed";
  }
  if (shippingState === "failed") {
    return "cancelled";
  }
  return "";
}

function mapPaymentStatus(shippingState: string, paymentMethod: string | null) {
  if (shippingState === "delivered" && paymentMethod === "cod") {
    return "paid";
  }
  if (shippingState === "failed") {
    return "failed";
  }
  return "";
}

function ensureAuthorized(request: Request) {
  const secret = process.env.BOSTA_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }
  const header =
    request.headers.get("x-bosta-secret") ||
    request.headers.get("x-bosta-token") ||
    request.headers.get("x-webhook-token") ||
    request.headers.get("authorization") ||
    "";
  const value = header.replace(/^Bearer\s+/i, "").trim();
  return value === secret;
}

export async function POST(request: Request) {
  if (!ensureAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as BostaPayload | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = (payload.data ?? payload.delivery ?? {}) as Record<string, unknown>;
  const trackingNumber =
    readNestedString(data, "trackingNumber") ||
    readNestedString(data, "tracking_number") ||
    readString(payload.trackingNumber);
  const businessReference =
    readNestedString(data, "businessReference") ||
    readNestedString(data, "business_reference") ||
    readString(payload.businessReference);
  const stateValue = getStateValue(payload, data);
  const shippingState = mapShippingState(stateValue);
  const errorMessage =
    readString(payload.error) ||
    readNestedString(data, "error") ||
    readString(payload.message) ||
    readNestedString(data, "message");

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let orderQuery: any = supabase
    .from("orders")
    .select("id, payment_method, payment_status, status");

  if (businessReference) {
    orderQuery = orderQuery.eq("id", businessReference).maybeSingle();
  } else if (trackingNumber) {
    orderQuery = orderQuery.eq("shipping_tracking_number", trackingNumber).maybeSingle();
  } else {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const { data: order, error } = await orderQuery;
  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updates: Record<string, string | null> = {
    shipping_provider: "bosta",
    shipping_state: shippingState,
    shipping_tracking_number: trackingNumber || null,
    shipping_reference: businessReference || null,
    shipping_error: errorMessage || null,
  };

  const statusUpdate = mapOrderStatus(shippingState);
  if (statusUpdate) {
    updates.status = statusUpdate;
  }

  const paymentUpdate = mapPaymentStatus(shippingState, order.payment_method ?? null);
  if (paymentUpdate) {
    updates.payment_status = paymentUpdate;
  }

  const { error: updateError } = await supabase.from("orders").update(updates).eq("id", order.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
