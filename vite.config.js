import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    // Increase limit if your PDF/EPUB files are large
    assetsInlineLimit: 4096,
  },
  server: {
    // Needed so bare "three" imports resolve during dev
    host: true,
  },
});