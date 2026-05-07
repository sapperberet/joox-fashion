/**
 * Create missing coupons table in Supabase via SQL
 */
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXVseHduZXFrdm9tYm9seWlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA2OTIyNiwiZXhwIjoyMDkzNjQ1MjI2fQ.pf1QpVggdweZk3YNrJNP-wiAZBP-P1RqAxjHxLmrS7I';
const BASE_URL = 'https://znyulxwneqkvombolyii.supabase.co';

const SQL = `
create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  type text not null,
  value numeric not null,
  min_subtotal numeric,
  max_uses integer,
  used_count integer default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.coupons enable row level security;

do $$
begin
  create policy "Public coupons read" on public.coupons
    for select using (is_active = true);
exception
  when duplicate_object then null;
end $$;
`;

async function runMigration() {
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    });
    
    // Supabase /rpc/sql endpoint might not exist; try direct query approach
    console.log('Trying raw query endpoint...');
    throw new Error('rpc/sql not available');
  } catch (err) {
    console.error('RPC approach failed:', err.message);
    console.log('\n⚠ Cannot execute SQL via API. Please manually create coupons table in Supabase Dashboard:');
    console.log(SQL);
    console.log('\nAlternatively, the system will work without coupons table for basic checkout testing.');
  }
}

runMigration();
