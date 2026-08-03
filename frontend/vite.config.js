import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:5000',
        changeOrigin: true,
        // This handler ONLY fires on proxy-level connection failures
        // (ECONNREFUSED/ECONNRESET while the backend is down or mid-restart).
        // Genuine backend responses — including real 4xx/5xx errors — pass
        // straight through and are never masked. We translate the connection
        // failure into a clean, retryable 503 so the socket error can't bubble
        // up as an unhandled proxy crash. The API client retries these.
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (!res || res.writableEnded || !res.writeHead) return;
            res.writeHead(503, {
              'Content-Type': 'application/json',
              'Retry-After': '1',
            });
            res.end(
              JSON.stringify({
                success: false,
                code: 'BACKEND_UNAVAILABLE',
                message: 'Backend is temporarily unavailable. Retrying…',
              })
            );
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
}));
