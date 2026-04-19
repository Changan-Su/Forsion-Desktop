import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: parseInt(env.VITE_PORT || '2005'), // 从环境变量读取端口，默认 2005
        host: '0.0.0.0',

      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          includeAssets: ['favicon.svg', 'wallpapers/*.jpg'],
          manifest: {
            name: 'Forsion Desktop',
            short_name: 'Forsion',
            description: 'Forsion — AI 驱动的桌面工作空间',
            lang: 'zh-CN',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            orientation: 'any',
            background_color: '#3E406F',
            theme_color: '#3E406F',
            icons: [
              { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
              { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
              { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            // Precache the built app shell
            globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
            // Runtime cache for wallpapers + fonts + CDN tailwind
            runtimeCaching: [
              {
                urlPattern: ({ url }) => url.pathname.startsWith('/wallpapers/'),
                handler: 'CacheFirst',
                options: {
                  cacheName: 'forsion-wallpapers',
                  expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
              {
                urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-cdn',
                  expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
                },
              },
            ],
            // Never cache API requests — always hit the network
            navigateFallbackDenylist: [/^\/api\//],
          },
          devOptions: {
            // Enable SW in dev so 'Add to Home Screen' works on `npm run dev`
            enabled: false,
            type: 'module',
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
