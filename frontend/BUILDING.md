# Frontend bundle checks

`npm run build` creates the production PWA and runs `scripts/check-bundle.mjs`.
The check rejects JavaScript files over 500 KB, entry dependencies over 350 KB
combined, circular static chunk imports, and maps/scanner libraries imported
by the entry. `npm run check:bundle` checks an existing build.

Routes use React lazy imports inside a Suspense loading boundary; the shell
remains available while a page loads. All route assets remain in the PWA's
precache, preserving the existing offline behavior. Precache downloads can
still happen in the background; the entry budget measures startup JavaScript,
not the total offline cache.

MapLibre is pinned to 6.7.0 because the build uses the source modules shipped
with that package. Its prebundled entry cannot be split below 500 KB. The build
keeps the upstream shared/main boundary, derived from the shipped source map,
and extracts the shader strings and style-spec package into separate chunks.
The shared dependency closure keeps enum/helper modules on the correct side of
that boundary and prevents circular imports. Generic Vite/CommonJS helpers
are kept outside map chunks so they cannot pull map code into startup.

DeliveryMap explicitly sets a Vite-generated worker URL; the versioned worker
is emitted and precached for production, including subfolder deployments.

When upgrading MapLibre, update the exact package version and lockfile together,
then run the build checks and the production map fixture. Do not raise the
warning threshold or disable the checks to accommodate an upgrade.

The browser smoke fixture is `tests/fixtures/map-smoke.html`. It exercises the
real DeliveryMap with fixed, public Naga coordinates and a GeoJSON route, so
it requires no accounts, orders, or location permission. To verify a production
build of that fixture separately from the application:

```powershell
node --input-type=module -e "import {build} from 'vite'; import {resolve} from 'node:path'; await build({build:{outDir:'node_modules/.cache/habi-map-smoke',rollupOptions:{input:resolve('tests/fixtures/map-smoke.html')}}});"
npm run preview -- --host 127.0.0.1 --port 4173 --outDir node_modules/.cache/habi-map-smoke
```

Open `/tests/fixtures/map-smoke.html` on that preview server. Verify tiles,
pickup/drop-off markers, the purple route, zoom controls, coordinate selection,
and no worker or chunk-loading errors. The fixture is not an input to the
normal production build.
