import { defineConfig, devices } from '@playwright/test';
import { idDegliEndToEnd } from './src/lib/umami';

// La build degli end-to-end è quella pubblicata: nel workflow ha lo script di Umami solo con l'ID del repository, e senza la variabile esce
// senza contatore, e le prove del contatore si saltano. In locale, senza un ID, ne usa uno di prova, che non conta niente perché lo script
// conta solo sull'host pubblico del sito. Lo leggono anche le prove, che girano con questo stesso ambiente
process.env.AI_RADAR_UMAMI_ID = idDegliEndToEnd(process.env);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/' },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173/', reuseExistingServer: !process.env.CI, timeout: 180_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
