const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXVseHduZXFrdm9tYm9seWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjkyMjYsImV4cCI6MjA5MzY0NTIyNn0.UawYglGtxqlosz9BwmVvok2NQ9_SI9edstxCuEs-Hyc";
const BASE_URL = "https://znyulxwneqkvombolyii.supabase.co";

async function fetchJson(path) {
  const response = await fetch(`${BASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

async function run() {
  const [products, orders, coupons] = await Promise.all([
    fetchJson("products?select=id,name_en,stock_qty,bundle_qty,bundle_price&limit=1"),
    fetchJson("orders?select=id,customer_name,total,coupon_code,coupon_discount&limit=1"),
    fetchJson("coupons?select=id,code,type,value,max_uses,used_count,is_active&limit=1"),
  ]);

  console.log("Products table check:", products.ok ? "OK" : `FAIL ${products.status}`);
  console.log(JSON.stringify(products.data, null, 2));

  console.log("Orders table check:", orders.ok ? "OK" : `FAIL ${orders.status}`);
  console.log(JSON.stringify(orders.data, null, 2));

  console.log("Coupons table check:", coupons.ok ? "OK" : `FAIL ${coupons.status}`);
  console.log(JSON.stringify(coupons.data, null, 2));

  if (!products.ok || !orders.ok || !coupons.ok) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Schema check failed:", error);
  process.exitCode = 1;
});
