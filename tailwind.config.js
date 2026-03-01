import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const backendOrigin =
    env.VITE_BACKEND_ORIGIN || 'http://localhost:3000'

  return {
    plugins: [react(), tailwindcss()],
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
