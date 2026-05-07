# Database Migration Guide - Sale Fields

This document outlines the required database schema changes to support product sale functionality.

## Missing Columns

The following columns need to be added to the `products` table:
- `is_on_sale` (boolean, default: false)
- `sale_price` (numeric, nullable)
- `sale_percent` (integer, nullable)

## Migration SQL

Run the following SQL statements in your Supabase SQL Editor (https://app.supabase.com):

```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_percent integer;
```

## Steps to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project (Joox Fashion)
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query** and paste the SQL above
5. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# First, ensure you're logged in
supabase login

# Link to your project
supabase link --project-ref znyulxwneqkvombolyii

# Run the migration
supabase db push
```

### Option 3: PostgreSQL psql client

```bash
psql postgresql://postgres:[password]@db.znyulxwneqkvombolyii.supabase.co:5432/postgres

# Then run:
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_percent integer;
```

## Verification

After applying the migration, verify the columns exist:

```sql
-- Check column info
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name IN ('is_on_sale', 'sale_price', 'sale_percent');
```

## Application Readiness

Once the migration is applied, the following features become available:

- ✅ Admin form: Sale field inputs (is_on_sale checkbox, sale_price, sale_percent)
- ✅ Product API: Returns sale fields in product objects
- ✅ Server actions: createProduct and updateProduct handle sale fields
- ✅ UI: ProductCard displays sale ribbon and struck-through prices

## Testing Sale Products

After migration:

1. Navigate to `/atelier` (admin panel)
2. Create a new product with:
   - Name: "Sale Product QA"
   - Price: 100
   - Check "On sale"
   - Sale Price: 80 (OR)
   - Sale Percent: 20
3. The product should appear in the product list with a "Sale" ribbon
4. The storefront should display the struck-through original price and the sale price

## Rollback (if needed)

To remove the sale columns:

```sql
ALTER TABLE public.products DROP COLUMN IF EXISTS is_on_sale CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS sale_price CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS sale_percent CASCADE;
```
