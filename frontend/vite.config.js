import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

// Preserve MapLibre's own shared/main boundary while allowing its shader
// strings to live in a separate chunk. The upstream source map identifies
// that boundary without maintaining a duplicate list of vendor internals.
const maplibreSharedSources = new Set(JSON.parse(readFileSync(
  new URL('./node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs.map', import.meta.url), 'utf8',
)).sources.filter((source) => source.startsWith('../src/')).map((source) => source.slice('../src/'.length)));
let sharedModuleIds;

// Set VITE_BASE=/habi/ (with slashes) to build for a subfolder deployment.
const BASE = process.env.VITE_BASE || '/';

export default defineConfig({
  base: BASE,
  resolve: {
    // Use the pinned package's modules instead of its indivisible 578 KB
    // distribution entry, so shader strings can be split from the renderer.
    alias: [{ find: /^maplibre-gl$/, replacement: fileURLToPath(new URL('./node_modules/maplibre-gl/src/index.ts', import.meta.url)) }],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['bayan-tile-32.png', 'bayan-tile-64.png', 'bayan-tile-192.png', 'bayan-tile-512.png', 'habi-logo-concept.png'],
      manifest: {
        name: 'HABI',
        short_name: 'HABI',
        description: 'Local commerce, delivery, and services woven together.',
        theme_color: '#673de6',
        background_color: '#12111d',
        start_url: BASE,
        scope: BASE,
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait-primary',
        icons: [
          { src: 'bayan-tile-32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
          { src: 'bayan-tile-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'bayan-tile-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'bayan-tile-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'mapbox-tiles', expiration: { maxEntries: 200, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  // Keep the pinned MapLibre source modules available for chunking in dev.
  // DeliveryMap explicitly supplies the Vite-built worker URL in both modes.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
    // maplibre-gl is excluded, but these of its deps are CommonJS with no ESM
    // entry, so the browser fails on import (no default export) when served
    // raw. Pre-bundle just those so esbuild adds interop.
    include: ['murmurhash-js', '@maplibre/mlt', 'earcut'],
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id, { getModuleIds, getModuleInfo }) {
          // These helpers are shared with the app entry; keeping them outside
          // map chunks prevents a helper import from eagerly loading the map.
          if (id.includes('commonjsHelpers.js') || id.includes('vite/preload-helper')) return 'runtime';
          if (!sharedModuleIds) {
            sharedModuleIds = new Set();
            const includeDependencies = (moduleId) => {
              if (sharedModuleIds.has(moduleId)) return;
              sharedModuleIds.add(moduleId);
              for (const dependency of getModuleInfo(moduleId)?.importedIds || []) includeDependencies(dependency);
            };
            for (const moduleId of getModuleIds()) {
              const source = moduleId.replace(/\\/g, '/').split('/node_modules/maplibre-gl/src/')[1];
              if (source && maplibreSharedSources.has(source)) includeDependencies(moduleId);
            }
          }
          const path = id.replace(/\\/g, '/');
          if (path.includes('/node_modules/maplibre-gl/src/shaders/glsl/')) return 'map-shaders';
          if (path.includes('/node_modules/@maplibre/maplibre-gl-style-spec/')) return 'map-style-spec';
          if (sharedModuleIds.has(id)) return 'maplibre-shared';
          if (path.includes('/node_modules/maplibre-gl/dist/maplibre-gl-shared')) return 'maplibre-shared';
          if (path.includes('/node_modules/maplibre-gl/')) return 'maplibre';
          if (path.includes('/node_modules/leaflet/')) return 'leaflet';
          if (path.includes('/node_modules/@zxing/')) return 'barcode-decoder';
          if (path.includes('/node_modules/html5-qrcode/')) return 'qr-scanner';
        },
      },
    },
  },
});
