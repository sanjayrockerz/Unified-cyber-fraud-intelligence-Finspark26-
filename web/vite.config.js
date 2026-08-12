import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const renderApi = process.env.VITE_API_BASE || 'https://unified-cyber-fraud-intelligence.onrender.com'

export default defineConfig({
  plugins: [react()],
  // Keep every existing API consumer pointed at the deployed backend when a
  // Vercel project was created without VITE_API_BASE.
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(renderApi),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          graph: ['react-force-graph-2d'],
        },
      },
    },
  },
})
