import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static build. `base: './'` keeps every asset path relative so the bundle
// works behind any Nginx location and from a LAN IP without configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: ['es2020', 'safari14'],
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
} as any);
