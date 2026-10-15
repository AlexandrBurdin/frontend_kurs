import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Для каждого прогона — чистый файл данных
const dataFile = path.join(mkdtempSync(path.join(tmpdir(), 'rb-e2e-')), 'recipes.json');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'retain-on-failure',
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } },
      grepInvert: /@mobile/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    { command: 'node e2e/mock-mealdb.mjs', port: 4100, reuseExistingServer: false },
    {
      command: 'node server/dist/index.js',
      port: 4000,
      reuseExistingServer: false,
      env: { DATA_FILE: dataFile, MEALDB_URL: 'http://localhost:4100/api/json/v1/1', PORT: '4000' },
    },
  ],
});
