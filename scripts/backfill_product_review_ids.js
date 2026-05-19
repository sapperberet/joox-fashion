#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    realtime: {
      transport: WebSocket,
    },
    auth: {
      persistSession: false,
    },
  },
);

async function backfillProductReviewIds() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, slug")
    .not("slug", "is", null);

  if (productsError) {
    console.error("Failed to load products:", productsError.message);
    process.exit(1);
  }

  let updated = 0;
  for (const product of products || []) {
    if (!product.slug || product.slug === product.id) {
      continue;
    }

    const { error } = await supabase
      .from("product_reviews")
      .update({ product_slug: product.id })
      .eq("product_slug", product.slug);

    if (error) {
      console.error(`Failed to update reviews for ${product.slug}:`, error.message);
      continue;
    }
    updated += 1;
  }

  console.log(`Backfill complete. Updated ${updated} product slug mappings.`);
}

backfillProductReviewIds().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
