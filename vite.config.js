import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  // Local Vite credentials live with the app in app/.env.
  envDir: '.',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
