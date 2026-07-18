import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  envDir: '.',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
