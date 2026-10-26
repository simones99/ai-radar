// Solo per `npm run scatto`: gli screenshot di tests/scatto, fuori dagli end-to-end.
import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({ ...base, testDir: 'tests/scatto', retries: 0 });
