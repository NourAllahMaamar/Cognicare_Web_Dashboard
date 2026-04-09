import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
      tailwindcss()
    ],
    build: {
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-i18n': ['i18next', 'react-i18next'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-motion': ['framer-motion'],
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
