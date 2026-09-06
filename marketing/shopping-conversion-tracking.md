# Shopping journey and conversion tracking

Implemented September 6, 2026.

## Shopper behavior

- Add-to-cart while signed out returns to the selected product and quantity after sign-in or registration. The shopper presses Add to Cart to confirm after returning. Selection survives a refresh and password-reset flow.
- Header login and protected cart links also preserve a safe storefront return destination. External redirects and login loops are rejected.
- Adding a product uses `POST /api/cart/items`, an incremental, stock-checked operation. It does not replace the existing cart. Full-cart synchronization remains for editing the cart and checkout.
- Editing the delivery address from checkout returns to the cart after a successful save; the chosen pickup/delivery mode is retained for the tab.
- Home and search share a saved municipality/barangay selector. Options come from merchants with available products. Exact store-location filters apply to both organic and sponsored inventory. All locations clears the restriction.
- Store location does not certify delivery coverage, change the profile address, or request GPS permission. Checkout still validates delivery against the actual address.

## Admin report

Admin Dashboard → Shopping conversions shows the last 30 days of event counts and distinct sessions: storefront visits, product views, successful cart additions, checkout attempts, checkout errors, and server-confirmed orders placed. It also shows completed/delivered tracked orders and orders grouped by campaign.

This is session activity, not an ordered cohort funnel. Repeated actions can produce repeated events; event IDs prevent duplicate receipt of the same event. Browser events may be blocked or manipulated and should not be used for accounting. Order placement is recorded server-side and cannot be submitted through the public events endpoint. A COD order is an order placed, not a completed payment. Completion is derived from the current order state, excluding cancelled/refunded orders.

First-touch campaign attribution is stored for the browser tab, expiring after 24 hours. Add `utm_source`, `utm_medium`, and `utm_campaign` to campaign links, e.g. `/?utm_source=facebook&utm_medium=social&utm_campaign=tara_launch`. Labels accept letters, digits, spaces, periods, underscores, and hyphens (80 characters maximum). Do not put personal information in campaign labels. Untagged orders appear as Direct / untagged.

Tracking uses the application's own API/database. No GA4 or advertising account is required. Events contain a random session ID, event ID, optional product ID/quantity, and campaign labels. They do not collect contact details, exact location, search text, or full page URLs. Demo events are skipped. Analytics failures never block cart additions or checkout. There is no automatic raw-event retention purge in this release; reports show a rolling 30-day window.

## Deployment

Deploy both backend and frontend. Before serving the new frontend, apply the new additive migration:

```powershell
cd backend
php artisan migrate --path=database/migrations/2026_09_06_000001_create_conversion_events_table.php --force
```

The migration has been applied to the local `bayanbox` PostgreSQL database. No production deployment was performed. Existing orders are not backfilled.

## Verification

```powershell
cd backend
php artisan test --filter=ShoppingJourneyTest
```

From the frontend directory:

```powershell
node --test tests/purchaseJourney.test.js
npm run build
```

Backend tests use the isolated SQLite test database. Coverage includes existing-cart preservation, stock limits, authentication, exact location and sponsored-ad filtering, event validation/deduplication, admin report authorization, server-side order confirmation, failed checkout, and analytics storage failure.
