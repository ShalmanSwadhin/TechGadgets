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
        // During a backend restart the target port may briefly be closed.
        // Return a clean 503 JSON response instead of letting the socket
        // error bubble up as an unhandled proxy crash.
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res.writableEnded || !res.writeHead) return;
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: false,
                message: 'Backend is starting up. Please retry in a moment.',
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
