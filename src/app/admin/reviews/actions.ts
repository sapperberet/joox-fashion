"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function getRedirectUrl(formData: FormData, flash?: "reviewShown" | "reviewHidden" | "reviewDeleted" | "actionFailed" | "missingData") {
  const params = new URLSearchParams();
  const q = String(formData.get("q") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (q) params.set("q", q);
  if (slug) params.set("slug", slug);
  if (flash) {
    params.set("flash", flash);
    params.set("kind", flash === "actionFailed" || flash === "missingData" ? "error" : "success");
  }
  const query = params.toString();
  return query ? `/admin/reviews?${query}` : "/admin/reviews";
}

function getReviewId(formData: FormData) {
  return String(formData.get("review_id") ?? "").trim();
}

export async function toggleReviewVisibility(formData: FormData) {
  const reviewId = getReviewId(formData);
  const nextVisible = String(formData.get("is_visible") ?? "true") === "true";
  if (!reviewId) {
    redirect(getRedirectUrl(formData, "missingData"));
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("product_reviews").update({ is_visible: nextVisible }).eq("id", reviewId);
  if (error) {
    redirect(getRedirectUrl(formData, "actionFailed"));
  }
  revalidatePath("/admin/reviews");
  redirect(getRedirectUrl(formData, nextVisible ? "reviewShown" : "reviewHidden"));
}

export async function deleteReview(formData: FormData) {
  const reviewId = getReviewId(formData);
  if (!reviewId) {
    redirect(getRedirectUrl(formData, "missingData"));
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId);
  if (error) {
    redirect(getRedirectUrl(formData, "actionFailed"));
  }
  revalidatePath("/admin/reviews");
  redirect(getRedirectUrl(formData, "reviewDeleted"));
}