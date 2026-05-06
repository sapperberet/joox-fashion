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
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key,
  customer_name text not null,
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

create policy "Public categories read" on public.categories
  for select using (true);

create policy "Public products read" on public.products
  for select using (is_active = true);

create policy "Public orders insert" on public.orders
  for insert with check (true);

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict do nothing;

create policy "Public products bucket read" on storage.objects
  for select using (bucket_id = 'products');

create policy "Public receipts bucket read" on storage.objects
  for select using (bucket_id = 'receipts');

create policy "Public products upload" on storage.objects
  for insert with check (bucket_id = 'products');

create policy "Public receipts upload" on storage.objects
  for insert with check (bucket_id = 'receipts');

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
