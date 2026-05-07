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
