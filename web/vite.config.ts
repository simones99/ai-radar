/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { imagetools } from 'vite-imagetools';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [svelte(), imagetools()],
  // nei test i componenti Svelte vanno risolti nella versione per browser
  resolve: mode === 'test' ? { conditions: ['browser'] } : undefined,
  build: { outDir: '../_site', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
}));
