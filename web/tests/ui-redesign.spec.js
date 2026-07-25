import { expect, test } from '@playwright/test';

test('exposes the complete grouped Fuzen AI navigation', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');

  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Operations Center' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cases' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Executive Command Center' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
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

test('every top-level nav destination is visible, including Overview', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/');
  const destinations = [
    'Overview', 'Operations Center', 'Cases', 'Customers', 'Investigation',
    'Analytics', 'Reports', 'Session Intelligence', 'Graph Runtime',
    'Executive Command Center', 'Telemetry', 'Banking', 'Synthetic Lab',
    'SDK Runtime', 'Settings',
  ];
  for (const name of destinations) {
    // Some nav items (Operations Center, Cases) appear in both pinned and group sections;
    // use .first() to resolve strict-mode ambiguity when multiple elements match
    const locator = page.getByRole('link', { name });
    await expect(locator.first()).toBeVisible();
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
