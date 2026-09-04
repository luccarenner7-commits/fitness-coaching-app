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
    VitePWA({
      registerType: 'autoUpdate',
      // Ship a service worker that unregisters any previously installed one and
      // clears its caches. An early deploy cached a broken/empty shell for some
      // clients ("black screen"); this cleans them up. A real caching SW comes
      // back in the polish phase.
      selfDestroying: true,
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Leo Pirzer Coaching',
        short_name: 'LP Coaching',
        description: 'Trainingsplan, Trainingsdaten, Schmerztagebuch und ToDos.',
        lang: 'de',
        dir: 'ltr',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: base + 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
});
