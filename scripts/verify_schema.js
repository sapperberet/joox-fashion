const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXVseHduZXFrdm9tYm9seWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjkyMjYsImV4cCI6MjA5MzY0NTIyNn0.UawYglGtxqlosz9BwmVvok2NQ9_SI9edstxCuEs-Hyc';
const BASE_URL = 'https://znyulxwneqkvombolyii.supabase.co';

async function verify() {
  console.log('Checking products table columns...');
  const prodRes = await fetch(`${BASE_URL}/rest/v1/products?select=id,name_en,stock_qty,bundle_qty,bundle_price&limit=1`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  const products = await prodRes.json();
  console.log('✓ Products:', products.length > 0 ? 'HAS columns' : 'empty');
  if (products.length > 0) console.log('  Sample:', JSON.stringify(products[0], null, 2));

  console.log('\nChecking orders table columns...');
  const ordRes = await fetch(`${BASE_URL}/rest/v1/orders?select=id,coupon_code,coupon_discount,shipping_provider&limit=1`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  const orders = await ordRes.json();
  console.log('✓ Orders:', orders.code ? 'Error: ' + orders.message : 'HAS columns');

  console.log('\nChecking coupons table...');
  const couponRes = await fetch(`${BASE_URL}/rest/v1/coupons?select=id,code,type,value&limit=1`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  const coupons = await couponRes.json();
  console.log('✓ Coupons:', coupons.code ? 'Error: ' + coupons.message : 'TABLE EXISTS');
}

verify().catch(console.error);
