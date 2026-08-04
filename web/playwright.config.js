import { defineConfig } from '@playwright/test';

// Without this file `npx playwright test` has no project scope and picks up the
// Vitest setup instead, which fails before any spec runs. Scoping it to tests/
// keeps the unit suite (src/**/*.test.jsx, run by Vitest) out of Playwright.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  reporter: 'line',
  webServer: [
    {
      command: 'python e2e_backend.py',
      url: 'http://127.0.0.1:8000/health/live',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'node e2e_vite.mjs',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
});
