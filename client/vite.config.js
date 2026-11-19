import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // El cliente habla siempre en relativo; el backend escucha en 3001
      '/api' : {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads' : 'http://localhost:3001',
    },
  },
})
