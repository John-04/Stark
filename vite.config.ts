import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/rpc': {
        target: 'https://e8eeb24f808b.ngrok-free.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rpc/, ''),
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    }
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
})
