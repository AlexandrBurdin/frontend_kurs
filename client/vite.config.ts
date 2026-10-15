/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Запросы к API проксируются на сервер Node.js
    proxy: { '/api': 'http://localhost:4000' },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Выделение библиотек в отдельный чанк улучшает кэширование
    rollupOptions: {
      output: { manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] } },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    css: false,
  },
});
