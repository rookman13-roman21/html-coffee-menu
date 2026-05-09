import { defineConfig } from 'vite';

export default defineConfig({
  // root = папка где лежит index.html (по умолчанию — папка vite.config.js)
  // publicDir = 'public' (по умолчанию) — файлы оттуда копируются в dist как есть
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
