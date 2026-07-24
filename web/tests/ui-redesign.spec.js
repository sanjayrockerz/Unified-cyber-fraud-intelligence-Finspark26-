import { expect, test } from '@playwright/test';

test('exposes the complete grouped Fusion Risk OS navigation', async ({ page }) => {
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
