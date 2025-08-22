import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/rpc': {
        target: 'https://33b60227a006.ngrok-free.app',
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
