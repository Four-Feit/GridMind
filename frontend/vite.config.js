import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'components': path.resolve(import.meta.dirname, './src/components'),
      'services': path.resolve(import.meta.dirname, './src/services'),
      'pages': path.resolve(import.meta.dirname, './src/pages'),
      'hooks': path.resolve(import.meta.dirname, './src/hooks'),
      'styles': path.resolve(import.meta.dirname, './src/styles'),
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/mission': 'http://localhost:8000',
      '/chaos': 'http://localhost:8000',
      '/grid': 'http://localhost:8000',
      '/agent': 'http://localhost:8000',
      '/events': 'http://localhost:8000',
      '/capabilities': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  }
})
