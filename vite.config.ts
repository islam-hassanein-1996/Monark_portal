import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest, not generateSW: sw.ts owns the routing (see the /pages
      // navigation denylist), and the precache list has to come from the real
      // build output because asset names are content-hashed.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // A field device must never reload itself out from under an in-progress
      // reading. The prompt UI lands with phase 4; until then an update simply
      // waits for every tab to close.
      registerType: 'prompt',
      injectRegister: 'auto',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // The tools under public/pages/ total ~2.2 MB and are cached on demand in
        // phase 3, not paid for at install time.
        globIgnores: ['pages/**'],
      },
      manifest: {
        name: 'Monark Portal',
        short_name: 'Monark',
        description: 'Unified access to Monark geological tools and services',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
