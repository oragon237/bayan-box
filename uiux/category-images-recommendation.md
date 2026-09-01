# Bayan — Homepage Real Images Recommendation (Category Rail + Flash Grid)

> **Purpose**: replace emoji tiles with **real product/category photos** on the HomepageV2 category rail and flash-sale grid — grounded in the actual codebase.
> **Files inspected**: `frontend/src/pages/marketplace/HomepageV2.jsx` (current implementation), `backend/app/Http/Controllers/Api/MarketplaceController.php` (products + categories endpoints), `backend/app/Models/Product.php` (image_url column, scopes).
> **Design system**: `uiux/design-system.md` (ImageFallback pattern, bayan-100→ink-100 tile, rounded-2xl, offline-first).

---

## 1. What already exists (current state)

**Frontend — `HomepageV2.jsx`:**
- `CATEGORIES` is a **static rail** (6 entries: Fresh Produce, Home Cooks, Local Crafts, Packaging, Provincial Goods, Points Shop) with emoji `icon` + link `to` (lines 22–29).
- `CategoryRail` (lines 150–174) now accepts a `categoryImages` map: when `categoryImages[c.label]` exists it renders a real `<img className="w-full h-full object-cover">`, otherwise falls back to the emoji `c.icon` inside the `w-14 h-14 rounded-2xl bg-bayan-50` tile.
- The page fetches **`/products?per_page=100`** (line 328) and builds the map client-side: first product per category that has a non-null `image_url` (lines 330–336).
- `FlashGrid` and `ProductCard` already render **real product images** via `ImageFallback src={p.image_url}` (lines 191, 249); the fallback tile is the bayan-100→ink-100 gradient.

**Backend — `MarketplaceController.php`:**
- `GET /api/products` (line 24): paginated (`per_page` default 24), filters `category | q | city | barangay | on_sale | points_only | sort`, eager-loads `images` + review counts, returns each product with its `image_url` **direct column**.
- `GET /api/products/categories` (line 147): returns **only a flat array of distinct category name strings** — no images, no slugs, no counts, no icons.

**Data model — `Product.php`:** `image_url` is a nullable direct column (fillable list line 16); `images()` is a separate gallery `hasMany` with `sort_order` (line 50); `scopeActive()` = `status=active AND stock>0 AND availability=available` (line 71).

---

## 2. Data reality check

| Question | Answer from code |
|---|---|
| Do products carry a usable image URL? | Yes — `products.image_url` (nullable; some rows null) plus `product_images` gallery |
| Is there a public categories endpoint? | Yes — `GET /api/products/categories`, but **strings only** |
| Can I fetch "one product per category"? | Yes — `GET /api/products?category=<name>&per_page=1`, or scan a large page |
| Are banner images usable for the rail? | No — banners are marketing promos, not category visuals; keep them for the hero only |
| Does the API return image per category in one call? | **No** — this is the gap this doc closes |

---

## 3. Issues with the current approach (the `per_page=100` scan)

1. **[P1] Page-1-only sampling misses categories.** The map is built from the **first page** (`per_page=100`) in default sort (`is_official_mall` desc, then latest). A category whose first 100 products all have `image_url = null`, or that sorts after the page cut, gets **no image** and silently shows the emoji. Correct but weak.
2. **[P1] Payload bloat on a mobile-first PWA.** `/products?per_page=100` returns 100 full products with review aggregates + merchant data, only to harvest ~6 thumbnails. The page already fires 3 requests (`/banners`, flash `/products`, grid `/products`); this adds a heavy 4th — bad on provincial 3G/4G.
3. **[P2] Non-deterministic "hero" pick.** "First product with an image" depends on sort order — the tile could show any product (or a low-quality photo). No rating/sales weighting.
4. **[P2] onError leaves a blank tile.** `ImageFallback` hides the `<img>` on error (`display: none`), and `CategoryRail`'s inline `<img>` does the same — when a URL 404s, the user sees an **empty gradient tile**, not the emoji fallback. The emoji only renders when `src` is falsy, not when it fails.
5. **[P2] No offline cache for the map.** The derived map lives in component state only; offline-first (PRD §2.2) means the rail should degrade to cached images, not blank tiles.
6. **[P3] Static rail vs. live categories.** The rail is hardcoded while the backend serves real distinct categories; a new admin category (PRD §4.18 `categories` table) won't appear until the frontend list is edited. (Points Shop is intentionally pinned — it's a `points_only` product set, not a real category.)

---

## 4. Recommendation (phased)

### Phase 1 — Backend: enrich `GET /api/products/categories` (primary, small change)

Extend the existing `categories()` method to return **one hero image per category** (and optionally a product count). One tiny endpoint serves the whole rail — no client scanning, deterministic, PWA-friendly.

```php
// MarketplaceController::categories() — returns [{name, image_url, count}]
public function categories(): JsonResponse
{
    $cats = Product::active()
        ->selectRaw("category, count(*) as total, min(id) as sample_id")
        ->groupBy('category')
        ->orderBy('category')
        ->get();

    // Pick a real, non-null image per category (prefer official mall, then latest)
    $images = Product::active()
        ->whereNotNull('image_url')
        ->orderByDesc('is_official_mall')
        ->orderByDesc('id')
        ->get(['category', 'image_url'])
        ->unique('category');

    return response()->json(
        $cats->map(fn ($c) => [
            'name' => $c->category,
            'count' => (int) $c->total,
            'image_url' => $images->firstWhere('category', $c->category)?->image_url ?? null,
        ])
    );
}
```

- **Tradeoff**: one backend change; the payload is ~6 rows. Backward-compatible enough to extend the array shape (frontend adapts; old consumers ignore extra fields).
- **Deterministic priority**: `is_official_mall` first → latest — so Bayan Mall goods lead the rail tiles (brand-consistent), then newest merchant photos.
- **Fallback still needed**: `image_url` may be null per category → client falls back to a curated map → emoji.

### Phase 2 — Frontend: category image resolution order (keep the current derive as offline fallback)

Build one resolver used by `CategoryRail`:

```
1. API  → GET /products/categories            → real {name, image_url} (Phase 1)
2. CACHE→ last-fetched categories+images (IndexedDB / SW cache)   → offline
3. CURATED MAP → static asset per known category (below)          → always branded
4. EMOJI → c.icon (current fallback)                              → never blank
```

**Curated static map** (zero network, guaranteed visuals — small local SVGs/JPEGs in `frontend/public/images/categories/`):

```js
const CATEGORY_IMAGE_FALLBACKS = {
  'Fresh Produce':   '/images/categories/fresh-produce.jpg',
  'Home Cooks':      '/images/categories/home-cooks.jpg',
  'Local Crafts':    '/images/categories/local-crafts.jpg',
  'Packaging':       '/images/categories/packaging.jpg',
  'Provincial Goods':'/images/categories/provincial-goods.jpg',
  'Points Shop':     '/images/categories/points-shop.jpg', // or keep ⭐ emoji
};
```

- **Tradeoff**: static assets cost a little repo space but guarantee the rail looks complete even when merchants have no photos — which is the *real* seed-data condition (28 products, some without images).

### Phase 3 — Fix `ImageFallback` so failures show the emoji, not a blank tile

```jsx
function ImageFallback({ src, alt, className, emoji = '🛍️' }) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return (
    <div className={`bg-gradient-to-br from-bayan-100 to-ink-100 flex items-center justify-center overflow-hidden ${className}`}>
      {show
        ? <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} loading="lazy" />
        : <span className="text-3xl">{emoji}</span>}
    </div>
  );
}
```

Apply the same `failed` state to the `CategoryRail` inline `<img>` so a 404 drops to the emoji instead of an empty tile.

---

## 5. Alternative approaches & tradeoffs (for the record)

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Client-side scan (current)** | No backend change; works today | Page-1-only sampling, 100-row payload, non-deterministic | Keep only as offline fallback |
| **B. Enriched `/products/categories`** (recommended) | 1 tiny request, deterministic, PWA-friendly | One backend change | **Adopt — Phase 1** |
| **C. Curated static fallback map** | Guaranteed visuals, offline-safe, zero API | Static assets must be maintained; not "live" | **Adopt — Phase 2** |
| **D. Per-category N requests** (`?category=X&per_page=1`) | Exact per-category first image | 6–10 extra round trips on cold cache — worst for provincial networks | Avoid |
| **E. Admin-uploaded category icons** (extend `categories` table, PRD §4.18) | Merchants/admin control imagery | Requires admin UI + migration; scope creep | Defer to post-v3 polish |

**Recommended stack = B + C + A(fallback)**, with the emoji as the final safety net.

---

## 6. Flash grid & product grid specifics (already mostly correct)

- **Flash grid** (`FlashGrid`, line 191) and **product grid** (`ProductCard`, line 249) already show real `p.image_url` — keep this; it's the strongest "real images" surface. No emoji needed there (products are real).
- **Fix**: route them through the improved `ImageFallback` (Phase 3) so failed URLs show the 🛍️ tile instead of a blank gradient.
- **Lazy loading**: add `loading="lazy"` to below-the-fold grid images (flash grid + product grid); keep the hero carousel `eager` (LCP asset).
- **Sizing per design system**: category rail tile `w-14 h-14` (56px) with `object-cover`; flash card `h-24`; product card `h-20`. All within existing tokens (rounded-lg crops, no design-system change).
- **Alt text**: `alt={c.label}` on rail tiles, `alt={p.name}` on product cards (already present).

---

## 7. Offline / PWA behavior (PRD §2.2)

1. **Cache the categories+images response** in the service worker precache list (`vite-plugin-pwa`) so the rail renders images on first offline load.
2. **Persist the last good `categoryImages` map** in IndexedDB alongside `offlineQueue`; on fetch failure, hydrate from cache before the emoji fallback.
3. **Never block layout on images**: tiles are fixed-size gradient boxes, so a missing image never causes layout shift (`w-14 h-14` stays reserved).

---

## 8. Acceptance checklist (definition of done)

- [ ] `GET /api/products/categories` returns `[{name, count, image_url}]` (Phase 1)
- [ ] `CategoryRail` renders real images for ≥ 90% of seeded categories (5 of 6, minus Points Shop if no photo)
- [ ] Broken image URL → emoji tile, never a blank gradient (Phase 3)
- [ ] Offline reload shows cached rail images or curated fallback, then emoji (never broken)
- [ ] `loading="lazy"` on flash + product grids; hero carousel eager
- [ ] No layout shift: tiles fixed `w-14 h-14` / `h-24` / `h-20`
- [ ] Alt text on every image (`category label` / `product name`)

---

## 9. Files to touch (when implemented)

| File | Change |
|---|---|
| `backend/app/Http/Controllers/Api/MarketplaceController.php` | `categories()` → include `image_url` + `count` |
| `frontend/src/pages/marketplace/HomepageV2.jsx` | Consume enriched endpoint; curated fallback map; `failed`-state images; lazy loading |
| `frontend/src/components/ui.jsx` (or local) | Upgrade `ImageFallback` with `failed` state + emoji prop |
| `frontend/public/images/categories/*` | Curated fallback assets (Phase 2) |
| `frontend/vite.config.*` / SW precache | Cache categories response for offline |
