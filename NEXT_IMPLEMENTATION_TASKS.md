# Next Implementation Tasks

This file captures the remaining work after auditing the current repo state. Items marked as verified are already implemented or partially implemented in code and should not be rebuilt from scratch.

## Verified Complete
- Rolling most-sold product lists already render on home and products pages.
- Product pages already support multiple images, colors, sizes, sale badges, FAQs, related items, reviews, and wishlist actions.
- Checkout already supports COD, wallet transfer, Instapay, receipt upload, and cart-side quantity editing.
- Order thank-you and tracking pages already display receipt images and shipping data.
- Admin already has customers, entries, search, reviews, scores, and full commerce management under Atelier.

## Still Needed

### P0
- ✅ **DONE**: Product routing now uses canonical UUID-based IDs (`/product/[id]` instead of `/product/[slug]`). All internal links already use product IDs and now align with the route. Old `/product/[slug]` folder can be safely deleted.
- ✅ **DONE**: Bosta webhook sync implemented in `src/app/api/bosta/webhook/route.ts` with automatic state mapping and order updates.
- ✅ **DONE**: Admin order controls expanded in `src/app/atelier/AtelierClient.tsx` — full status/payment/shipping/address updates in one place with feedback messages.

### P1
- ✅ **DONE**: Stronger admin management for events and categories with richer hierarchy support. Created `/atelier/events/` and `/atelier/categories/` pages with full CRUD operations, category types (collection, brand, style, occasion), parent-category relationships, descriptions, and icons.
- ✅ **DONE**: Richer deal management for buy-2-get-1 and product-specific trigger/applicability rules. Added `/atelier/deals/` with full form validation, bilingual support, and enhanced admin UI. Utility functions getApplicableDeals() and getDealDescription() for checkout integration. All 10 tests passing.
- ✅ **DONE**: Coupon claims visibility in account and checkout flows. Added dedicated "My Coupons" tab in account page showing available/claimed coupons with bilingual labels. Added coupons section to checkout cart summary showing top 3 claimable coupons with values and status indicators.
- ✅ **DONE**: Improve admin feedback states for create, update, delete, and upload actions with clearer success and error banners. Created reusable AdminAlert.tsx component with success/error/info types and consistent styling. Applied to all admin pages (AtelierClient, deals, events, categories, coupons) replacing inline flash divs with component calls.
- ✅ **DONE**: Normalize language coverage in admin and commerce flows so Arabic is visible everywhere the admin works. Expanded i18n.ts with 100+ new admin labels covering all forms, buttons, placeholders, error messages, and helper text. Updated AtelierClient, EventsClient, CategoriesClient, CouponsClient, and deals/coupons pages to use i18n instead of inline ternaries for complete bilingual support.

### P2
- ✅ **DONE**: Extend customer accounts with deeper profile settings, points history, and order preferences. Added Preferences tab with delivery speed selection, preferred delivery time picker, and category preferences with localStorage persistence. Enhanced Points tab with detailed Points History showing individual order point calculations. All preferences properly bilingual.
- Add more Amazon-style merchandising on product and category pages where it meaningfully helps shopping.
- ✅ **DONE**: Remove all decorative emoji (✓, ✕, ◇, ℹ, ←, →, 𓂀, 𓇳, 𓁹, 𓉐, and others) and replace with professional text, CSS-based styling, or semantic alternatives. Updated AdminAlert.tsx (•, ×, ⓘ icons), TrackClient (• bullet), CheckoutClient (— dashes), SiteHeader (removed ◇, replaced 𓏏 with •), SiteFooter (clean text), HomePageClient (clean text), ProductCard (clean text), ProductsClient (— dashes), ProductClient variants (clean text), and admin/page.tsx (● bullets). All 65 tests passing, linting clean.
- ✅ **DONE**: Run full test matrix after P0/P1 fixes. Created comprehensive edge-case test suite (src/lib/edge-cases.test.ts) with 39 tests covering checkout conflicts/deals/payments, tracking status transitions/delivery, admin permissions/bulk operations, and system concurrency/data validation. Total: 104 tests passing (65 original + 39 edge cases). Checkout flow: coupon stacking, deal conflicts, payment methods, cart quantities. Tracking flow: status transitions, tracking numbers, address changes. Admin: permission checks, action history, rate limiting, bulk operations, data consistency. All passing, linting clean.
