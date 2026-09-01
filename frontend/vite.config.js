import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'bayan-tile-192.png', 'bayan-tile-512.png', 'bayan-icon.svg', 'bayan-icon-white.svg', 'bayan-logo.svg', 'bayan-logo-white.svg', 'bayan-lockup.svg', 'bayan-tile.svg'],
      manifest: {
        name: 'HABI',
        short_name: 'HABI',
        description: 'Local commerce, delivery, and services woven together.',
        theme_color: '#673de6',
        background_color: '#12111d',
        start_url: '/',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait-primary',
        icons: [
          { src: 'bayan-tile-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'bayan-tile-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'bayan-tile-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
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
  // maplibre-gl is ESM-only and resolves its own web worker via
  // `new URL('maplibre-gl-worker.mjs', import.meta.url)`. Pre-bundling it into
  // .vite/deps breaks that worker URL ("file does not exist ... optimize deps
  // directory"), so exclude it from the dep optimizer and load it directly.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
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
    rollupOptions: { output: { manualChunks: { leaflet: ['leaflet'] } } },
  },
});