import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Output to dist/ for Cloudflare Pages deployment.
    // (For single-container Docker deployment, change back to '../backend/static')
    outDir: 'dist',
    emptyOutDir: true,
    // Raise warning threshold � our ERP bundle is legitimately large
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting � separates large vendor libs from app code
        // so browsers can cache them independently across deploys
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // State management
          'vendor-state': ['zustand', 'immer'],
          // HTTP + utilities
          'vendor-utils': ['axios', 'clsx', 'tailwind-merge'],
          // Icons (lucide is large � isolate it)
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Source maps for production error tracking (optional � comment out to save disk)
    // sourcemap: true,
  },

  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
