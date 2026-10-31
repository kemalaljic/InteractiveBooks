import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative base so the build works from any path (Cloudflare Pages root or a sub-folder).
  base: './',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // keep wasm/audio as real files so the service worker precaches them
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered manually in src/main.ts
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Slikovnice',
        short_name: 'Slikovnice',
        description: 'Interaktivne slikovnice: dodirni i slušaj.',
        lang: 'hr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#8fd3f4',
        theme_color: '#8fd3f4',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache EVERYTHING the app needs: code, wasm, art, audio, Rive files.
        globPatterns: ['**/*.{js,css,html,wasm,png,jpg,jpeg,webp,svg,mp3,m4a,ogg,riv,json}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
});
