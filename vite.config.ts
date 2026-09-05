import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app under /<repo>/. Set VITE_BASE at build time,
// e.g. VITE_BASE=/fitness-coaching-app/ npm run build
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    // No real caching in V1 — a stale SW cache blanked the page on some devices.
    // `selfDestroying` ships a SW that unregisters itself and wipes caches, so
    // any device still holding an old worker heals on its next visit. The
    // manifest still allows "add to home screen". Real offline caching = backlog.
    VitePWA({
      selfDestroying: true,
      manifest: {
        name: 'Leo Pirzer Coaching',
        short_name: 'LP Coaching',
        description: 'Trainingsplan, Trainingsdaten, Schmerztagebuch und ToDos.',
        lang: 'de',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          // SVG first (crisp at any size on browsers that support it) with
          // PNG fallbacks — iOS Safari and some Android/Chrome install flows
          // don't reliably pick up SVG manifest icons.
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
