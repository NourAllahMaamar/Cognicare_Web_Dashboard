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
