// vite.config.js - FIXED VERSION
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env variables based on current mode
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('🔧 Vite config - mode:', mode)
  console.log('🔧 VITE_API_URL:', env.VITE_API_URL)
  
  return {
    plugins: [react()],
    define: {
      // Don't override process.env - let Vite handle it
      'global': 'globalThis',
      // Make env variables available
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.PROD': mode === 'production',
      'import.meta.env.DEV': mode === 'development',
      'import.meta.env.MODE': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        process: "process/browser"
      }
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
          changeOrigin: true,
        },
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true, // Add sourcemaps for debugging
    }
  }
})