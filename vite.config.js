import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  // The app source lives in app/, but deployment credentials live beside this config.
  envDir: '..',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
