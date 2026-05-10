"use client";

import type { ProductReview } from "./types";

export type ReviewSort = "newest" | "highest" | "lowest";

export type ReviewSummary = {
  count: number;
  average: number;
  distribution: number[];
};

export async function fetchProductReviews(productSlug: string) {
  try {
    const response = await fetch(`/api/reviews?productSlug=${encodeURIComponent(productSlug)}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [] as ProductReview[];
    }
    const data = (await response.json()) as { reviews?: ProductReview[] };
    return Array.isArray(data.reviews) ? data.reviews : [];
  } catch {
    return [] as ProductReview[];
  }
}

export async function submitProductReview(input: {
  productSlug: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  body: string;
  token: string;
}) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? "Unable to submit review.");
  }

  return (await response.json()) as { review: ProductReview };
}

export function getReviewSummary(reviews: ProductReview[]): ReviewSummary {
  const count = reviews.length;
  const average = count > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map(
    (rating) => reviews.filter((review) => review.rating === rating).length,
  );

  return {
    count,
    average,
    distribution,
  };
}

export function sortProductReviews(reviews: ProductReview[], sort: ReviewSort) {
  const copy = [...reviews];

  if (sort === "highest") {
    return copy.sort((a, b) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (sort === "lowest") {
    return copy.sort((a, b) => a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function buildProductReview(review: {
  productSlug: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  body: string;
  sortOrder?: number | null;
}): ProductReview {
  return {
    id: `${review.productSlug}:${review.userEmail}:${Date.now()}`,
    product_slug: review.productSlug,
    user_name: review.userName,
    user_email: review.userEmail,
    rating: Math.max(1, Math.min(5, Math.round(review.rating))),
    title: review.title.trim(),
    body: review.body.trim(),
    sort_order: review.sortOrder ?? null,
    created_at: new Date().toISOString(),
  };
}