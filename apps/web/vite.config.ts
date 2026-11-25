import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on IPv4 + IPv6 (not just ::1): mobile device/viewer tools reach
    // the dev server over 127.0.0.1 or the LAN IP, which IPv6-only rejects.
    host: true,
    // The browser calls /api on its own origin; Vite forwards to Express.
    // Same-origin means cookies work in dev without CORS configuration.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
