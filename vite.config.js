import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://cognicare-mobile-h4ct.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://cognicare-mobile-h4ct.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
