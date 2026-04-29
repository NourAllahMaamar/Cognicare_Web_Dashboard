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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${backendOrigin} https: http: ws: wss:`,
    "frame-src https://accounts.google.com",
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
        // Use the custom src/sw.js so our cache-clear message handler, 
        // clientsClaim(), and legacy-cache cleanup are all active.
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['logo.svg', 'apple-touch-icon.png', 'font-detection.js'],
        manifest: {
          // `id` uniquely identifies the PWA – browsers use it to avoid
          // duplicating the installed app when start_url changes later.
          id: '/',
          name: 'CogniCare – Cognitive Health Platform',
          short_name: 'CogniCare',
          description: 'A cognitive health platform for autism care – manage organizations, families, and specialized treatment plans.',
          theme_color: '#2563EB',
          background_color: '#0f172a',
          display: 'standalone',
          // Preferred display modes in priority order (Chrome 113+ respects this)
          display_override: ['standalone', 'minimal-ui', 'browser'],
          scope: '/',
          start_url: '/?source=pwa',
          orientation: 'any',
          lang: 'fr',
          categories: ['health', 'medical', 'education'],
          icons: [
            { src: 'pwa-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: 'pwa-128x128.png', sizes: '128x128', type: 'image/png' },
            { src: 'pwa-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: 'pwa-152x152.png', sizes: '152x152', type: 'image/png' },
            // purpose 'any' = adaptive icon on Android
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-384x384.png', sizes: '384x384', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            // purpose 'maskable' = safe-zone icon for Android adaptive icons
            { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            {
              name: 'Specialist Dashboard',
              short_name: 'Specialist',
              url: '/specialist/login?source=shortcut',
              icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }],
            },
            {
              name: 'Organisation',
              short_name: 'Org',
              url: '/org/login?source=shortcut',
              icons: [{ src: 'pwa-96x96.png', sizes: '96x96', type: 'image/png' }],
            },
          ],
        },
        // For injectManifest strategy, only globPatterns is needed here.
        // All runtime caching / navigation fallback logic lives in src/sw.js.
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        },
        devOptions: {
          enabled: false,
        },
      })
    ],
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-motion': ['framer-motion'],
            'vendor-charts': ['recharts'],
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
