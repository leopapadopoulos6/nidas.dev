import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Phase 2 (concept board) is a plain multi-page Vite build.
// Phase 3 replaces this with the React shell once a direction is approved.
export default defineConfig({
  build: {
    target: 'es2022',
    // the throwaway prototype bundles all of three.js; Phase 3 code-splits the real scene
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        concepts: resolve(import.meta.dirname, 'concepts/index.html'),
        proto: resolve(import.meta.dirname, 'concepts/proto/index.html'),
      },
    },
  },
});
