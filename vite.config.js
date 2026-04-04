import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // IMPORTANT:
  // In dev we proxy /api and /uploads to the backend. If the Render hostname
  // is unreachable (DNS/ENOTFOUND), login will succeed nowhere and the UI
  // will appear to "not redirect".
  //
  // Set VITE_BACKEND_ORIGIN to your reachable backend, e.g.
  // - http://localhost:3000
  // - https://<your-deployed-backend>
  const backendOrigin =
    env.VITE_BACKEND_ORIGIN || 'http://localhost:3000'

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${backendOrigin} https: http: ws: wss:`,
  ].join('; ')

  return {
    plugins: [
      react({
        babel: {
          plugins: []  // Disable React Compiler
        }
      }),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['logo.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'CogniCare – Cognitive Health Platform',
          short_name: 'CogniCare',
          description: 'A cognitive health platform for autism care – manage organizations, families, and specialized treatment plans.',
          theme_color: '#2563EB',
          background_color: '#0f172a',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'any',
          categories: ['health', 'medical', 'education'],
          icons: [
            { src: 'pwa-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: 'pwa-128x128.png', sizes: '128x128', type: 'image/png' },
            { src: 'pwa-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: 'pwa-152x152.png', sizes: '152x152', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-384x384.png', sizes: '384x384', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          runtimeCaching: [
            {
              // Cache Google Fonts stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Cache Google Fonts webfont files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Cache API calls with network-first strategy
              urlPattern: /\/api\/v1\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
                networkTimeoutSeconds: 10,
              },
            },
            {
              // Cache uploaded images from Cloudinary or /uploads
              urlPattern: /\/(uploads|res\.cloudinary\.com)\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/],
        },
        devOptions: {
          enabled: false,
        },
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-i18n': ['i18next', 'react-i18next'],
          },
        },
      },
    },
    server: {
      headers: {
        'Content-Security-Policy': csp,
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: backendOrigin.startsWith('https://'),
        },
        '/uploads': {
          target: backendOrigin,
          changeOrigin: true,
          secure: backendOrigin.startsWith('https://'),
        },
      },
    },
  }
})
