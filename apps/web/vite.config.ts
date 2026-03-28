import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      '/ai': { target: 'http://127.0.0.1:3040', changeOrigin: true },
      '/site': { target: 'http://127.0.0.1:3040', changeOrigin: true },
      '/cards': { target: 'http://127.0.0.1:3040', changeOrigin: true },
    },
  },
})
