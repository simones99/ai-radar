/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig, runnerImport } from 'vite';
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
    {
      // i file che nascono dalle edizioni, nella stessa build: gli end-to-end la rilanciano e svuotano la cartella, e il workflow pubblica quella.
      // Dopo la scrittura perché serve il nome del foglio di stile della home. Le edizioni si leggono dalla loro cartella: non passano da public/data, e l'app non le carica
      name: 'edizioni',
      async writeBundle({ dir }, bundle) {
        const home = bundle['index.html'];
        if (!dir || home?.type !== 'asset') return;
        const { module } = await runnerImport<typeof import('./src/lib/edizioni/cartella.ts')>(fileURLToPath(new URL('./src/lib/edizioni/cartella.ts', import.meta.url)));
        module.scriviFilePubblici({
          dati: process.env.AI_RADAR_DATA_DIR ?? fileURLToPath(new URL('../data', import.meta.url)),
          uscita: dir,
          indirizzoBase: indirizzoBase(process.env.AI_RADAR_BASE_URL),
          htmlHome: String(home.source),
        });
      },
    },
  ],
  // nei test i componenti Svelte vanno risolti nella versione per browser
  resolve: mode === 'test' ? { conditions: ['browser'] } : undefined,
  build: { outDir: '../_site', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    // chi lancia Chromium sta a parte: `npm test` passa senza, e nel workflow gira prima della raccolta dei dati. `npm run test:browser` gira con gli end-to-end
    projects: [
      { extends: true, test: { name: 'app', include: ['src/**/*.test.ts'], exclude: ['src/**/*.browser.test.ts'] } },
      { extends: true, test: { name: 'browser', include: ['src/**/*.browser.test.ts'] } },
    ],
  },
}));
