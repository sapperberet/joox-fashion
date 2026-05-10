"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function getFlashUrl(token: string, flashCode: string) {
  const params = new URLSearchParams();
  params.set("admin_token", token);
  params.set("flash", flashCode);
  const kind = flashCode === "actionFailed" || flashCode === "missingData" ? "error" : "success";
  params.set("kind", kind);
  return `/atelier/coupons?${params.toString()}`;
}

function readText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function readNumber(input: FormDataEntryValue | null, fallback: number | null = null) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export async function requireAdmin(formData: FormData): Promise<string> {
  const token = formData.get("admin_token");
  if (!token || typeof token !== "string") {
    redirect("/atelier?flash=actionFailed&kind=error");
  }
  return token;
}

export async function setCouponRequirements(formData: FormData) {
  const token = await requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  try {
    const couponId = readText(formData, "coupon_id");
    const minScore = readNumber(formData.get("min_score"), 0) ?? 0;
    const minSpend = readNumber(formData.get("min_spend"), 0) ?? 0;

    if (!couponId) {
      redirect(getFlashUrl(token, "missingData"));
    }

    const { data: existing } = await supabase
      .from("coupon_requirements")
      .select("id")
      .eq("coupon_id", couponId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("coupon_requirements")
        .update({ min_score: minScore, min_spend: minSpend })
        .eq("coupon_id", couponId);

      if (error) {
        redirect(getFlashUrl(token, "actionFailed"));
      }
    } else {
      const { error } = await supabase.from("coupon_requirements").insert({
        coupon_id: couponId,
        min_score: minScore,
        min_spend: minSpend,
      });

      if (error) {
        redirect(getFlashUrl(token, "actionFailed"));
      }
    }

    revalidatePath("/atelier/coupons");
    redirect(getFlashUrl(token, "requirementsSet"));
  } catch {
    redirect(getFlashUrl(token, "actionFailed"));
  }
}

export async function deleteCouponRequirements(formData: FormData) {
  const token = await requireAdmin(formData);
  const supabase = getSupabaseAdmin();

  try {
    const couponId = readText(formData, "coupon_id");

    if (!couponId) {
      redirect(getFlashUrl(token, "missingData"));
    }

    const { error } = await supabase
      .from("coupon_requirements")
      .delete()
      .eq("coupon_id", couponId);

    if (error) {
      redirect(getFlashUrl(token, "actionFailed"));
    }

    revalidatePath("/atelier/coupons");
    redirect(getFlashUrl(token, "requirementsDeleted"));
  } catch {
    redirect(getFlashUrl(token, "actionFailed"));
  }
}
