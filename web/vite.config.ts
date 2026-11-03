/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { imagetools } from 'vite-imagetools';
import { indirizzoBase } from './src/lib/indirizzoBase.ts';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    svelte(),
    imagetools(),
    {
      // gli indirizzi assoluti dell'anteprima in index.html. Prima degli altri passi sull'HTML, che altrimenti
      // prenderebbero l'immagine di og:image per un file da cercare nel progetto
      name: 'anteprima-home',
      transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%INDIRIZZO_BASE%', indirizzoBase(process.env.AI_RADAR_BASE_URL)) },
    },
  ],
  // nei test i componenti Svelte vanno risolti nella versione per browser
  resolve: mode === 'test' ? { conditions: ['browser'] } : undefined,
  build: { outDir: '../_site', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
}));
