import { defineConfig, devices } from '@playwright/test';

// La build degli end-to-end ha lo script di Umami, come quella pubblicata: con l'ID del repository nel workflow, con uno di prova in locale.
// Qui non conta niente, perché lo script conta solo sull'host pubblico del sito. Lo leggono anche le prove, che girano con questo stesso ambiente
process.env.AI_RADAR_UMAMI_ID ||= '00000000-0000-4000-8000-000000000000';

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
