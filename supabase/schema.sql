create extension if not exists "uuid-ossp";

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name_en text not null,
  name_ar text,
  slug text not null unique,
  season text,
  sort_order integer,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  name_en text not null,
  name_ar text,
  slug text not null unique,
  description_en text,
  description_ar text,
  price numeric not null,
  image_url text,
  is_active boolean default true,
  featured boolean default false,
  season text,
  stock_qty integer,
  min_order_qty integer default 1,
  max_order_qty integer,
  order_multiple integer default 1,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key,
  customer_name text not null,
  customer_email text,
  phone text not null,
  address text not null,
  city text not null,
  district text,
  landmark text,
  building_number text,
  floor text,
  apartment text,
  notes text,
  payment_method text not null,
  payment_status text,
  receipt_url text,
  subtotal numeric not null,
  discount numeric not null,
  total numeric not null,
  items jsonb not null,
  status text,
  coupon_code text,
  coupon_discount numeric,
  shipping_provider text,
  shipping_tracking_number text,
  shipping_reference text,
  shipping_state text,
  shipping_error text,
  created_at timestamptz default now()
);

create table if not exists public.product_reviews (
  id uuid primary key default uuid_generate_v4(),
  product_slug text not null,
  user_id text not null,
  user_name text not null,
  user_email text not null,
  rating integer not null,
  title text not null,
  body text not null,
  is_visible boolean default true,
  created_at timestamptz default now()
);

create unique index if not exists product_reviews_product_user_unique
  on public.product_reviews (product_slug, user_id);

alter table public.product_reviews enable row level security;

create table if not exists public.customer_profiles (
  email text primary key,
  full_name text,
  phone text,
  city text,
  address text,
  points integer default 0,
  score integer default 0,
  tier text,
  settings jsonb default '{}'::jsonb,
  likes jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.customer_points_ledger (
  id uuid primary key default uuid_generate_v4(),
  email text,
  phone text,
  order_id uuid,
  delta integer not null,
  reason text,
  created_at timestamptz default now()
);

alter table public.customer_profiles enable row level security;
alter table public.customer_points_ledger enable row level security;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

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
  create policy "Public categories read" on public.categories
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public products read" on public.products
    for select using (is_active = true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public orders insert" on public.orders
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public product reviews read" on public.product_reviews
    for select using (is_visible = true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public customer profiles read" on public.customer_profiles
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public customer profiles upsert" on public.customer_profiles
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public customer profiles update" on public.customer_profiles
    for update using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public customer points read" on public.customer_points_ledger
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public customer points insert" on public.customer_points_ledger
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public coupons read" on public.coupons
    for select using (is_active = true);
exception
  when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict do nothing;

do $$
begin
  create policy "Public products bucket read" on storage.objects
    for select using (bucket_id = 'products');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public receipts bucket read" on storage.objects
    for select using (bucket_id = 'receipts');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public products upload" on storage.objects
    for insert with check (bucket_id = 'products');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public receipts upload" on storage.objects
    for insert with check (bucket_id = 'receipts');
exception
  when duplicate_object then null;
end $$;

alter table public.orders add column if not exists district text;
alter table public.orders add column if not exists landmark text;
alter table public.orders add column if not exists building_number text;
alter table public.orders add column if not exists floor text;
alter table public.orders add column if not exists apartment text;
alter table public.orders add column if not exists shipping_provider text;
alter table public.orders add column if not exists shipping_tracking_number text;
alter table public.orders add column if not exists shipping_reference text;
alter table public.orders add column if not exists shipping_state text;
alter table public.orders add column if not exists shipping_error text;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists coupon_discount numeric;
alter table public.products add column if not exists stock_qty integer;
alter table public.products add column if not exists min_order_qty integer default 1;
alter table public.products add column if not exists max_order_qty integer;
alter table public.products add column if not exists order_multiple integer default 1;
alter table public.products add column if not exists bundle_qty integer;
alter table public.products add column if not exists bundle_price numeric;
alter table public.products add column if not exists is_on_sale boolean default false;
alter table public.products add column if not exists sale_price numeric;
alter table public.products add column if not exists sale_percent integer;

create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  name_en text not null,
  name_ar text not null,
  deal_type text not null,
  trigger_product_ids uuid[] default array[]::uuid[],
  applicable_product_ids uuid[] not null,
  buy_quantity integer not null,
  free_quantity integer not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.deals enable row level security;

do $$
begin
  create policy "Public deals read" on public.deals
    for select using (is_active = true);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.subcategories (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name_en text not null,
  name_ar text not null,
  slug text not null,
  sort_order integer,
  created_at timestamptz default now()
);

alter table public.subcategories enable row level security;

do $$
begin
  create policy "Public subcategories read" on public.subcategories
    for select using (true);
exception
  when duplicate_object then null;
end $$;

alter table public.products add column if not exists subcategory_id uuid references public.subcategories(id) on delete set null;
alter table public.products add column if not exists breadcrumb_path text;

create table if not exists public.coupon_requirements (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  min_score integer default 0,
  min_spend numeric default 0,
  created_at timestamptz default now()
);

alter table public.coupon_requirements enable row level security;

do $$
begin
  create policy "Public coupon requirements read" on public.coupon_requirements
    for select using (true);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.customer_coupon_claims (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  claimed_at timestamptz default now(),
  used boolean default false,
  used_at timestamptz
);

alter table public.customer_coupon_claims enable row level security;

do $$
begin
  create policy "Public customer coupon claims read" on public.customer_coupon_claims
    for select using (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public customer coupon claims insert" on public.customer_coupon_claims
    for insert with check (true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "Public customer coupon claims update" on public.customer_coupon_claims
    for update using (true);
exception
  when duplicate_object then null;
end $$;
