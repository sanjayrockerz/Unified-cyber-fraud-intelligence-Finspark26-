import { defineConfig } from '@playwright/test';

// Without this file `npx playwright test` has no project scope and picks up the
// Vitest setup instead, which fails before any spec runs. Scoping it to tests/
// keeps the unit suite (src/**/*.test.jsx, run by Vitest) out of Playwright.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  reporter: 'line',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
});
