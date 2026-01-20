import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5847,
    proxy: {
      '/api': {
        target: 'http://localhost:9847',
        changeOrigin: true,
      },
      '/hook': {
        target: 'http://localhost:9847',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
})
