import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfmake/build/vfs_fonts.js'],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
      interval: 1000,           // Polling cada 1s en vez de 100ms (menos agresivo)
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/public/**',
      ],
    },
    hmr: {
      overlay: true,            // Mostrar errores en overlay, no recargar
    },
  },
})
