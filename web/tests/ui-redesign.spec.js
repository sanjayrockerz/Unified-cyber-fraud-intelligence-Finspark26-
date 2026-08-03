import { expect, test } from '@playwright/test';

// The sidebar deliberately shows six primary destinations plus a collapsed
// "Advanced" group. Cases is primary because it is the queue an investigation
// is entered from, so Overview -> Cases -> Investigation needs no expansion.
const PRIMARY_DESTINATIONS = [
  'Overview', 'Operations Center', 'Cases', 'Investigation', 'Analytics', 'Graph Runtime',
];

const ADVANCED_DESTINATIONS = [
  'Customers', 'Reports', 'Session Intelligence', 'Cyber Threat Intelligence',
  'Executive Command Center', 'Telemetry', 'Banking', 'Synthetic Lab',
  'SDK Runtime', 'Quantum Trust',
];

test('exposes the primary Fuzen AI navigation without expanding anything', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');

  for (const name of PRIMARY_DESTINATIONS) {
    await expect(page.getByRole('link', { name }).first()).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Settings' }).first()).toBeVisible();
});

test('keeps the Operations Center within its content viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/operations');
  await expect(page.locator('main')).toBeVisible();
  await page.waitForTimeout(500);

  const hasHorizontalOverflow = await page.locator('main').evaluate(
    (main) => main.scrollWidth > main.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
});

test('keeps the Investigation workspace within its content viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5173/investigation');
  await expect(page.locator('main')).toBeVisible();
  await page.waitForTimeout(500);

  const hasHorizontalOverflow = await page.locator('main').evaluate(
    (main) => main.scrollWidth > main.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
});

test('every nav destination is reachable once Advanced is expanded', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');

  // Advanced is collapsed by default -- that is the progressive-disclosure
  // behaviour, not a missing destination. Expanding it must reveal the rest.
  await page.getByRole('button', { name: 'Advanced' }).click();

  for (const name of [...PRIMARY_DESTINATIONS, ...ADVANCED_DESTINATIONS, 'Settings']) {
    // Some items appear in both the pinned and group sections; .first()
    // resolves strict-mode ambiguity when multiple elements match.
    await expect(page.getByRole('link', { name }).first()).toBeVisible();
  }
});

test('Overview link survives a cleared localStorage state', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
});

test('the retired /dashboard route no longer 404s into a dead page', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/dashboard');
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
});
