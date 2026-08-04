import { expect, test } from '@playwright/test';

const ROUTES = [
  '/', '/operations', '/cases', '/customers', '/investigation',
  '/analytics', '/reports', '/sessions', '/graph', '/executive',
  '/telemetry', '/banking', '/synthetic-lab', '/developer', '/settings',
];

for (const route of ROUTES) {
  test(`route ${route} renders without console errors or the ErrorBoundary fallback`, async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.goto(`http://127.0.0.1:5173${route}`);
    await page.waitForTimeout(800);
    await expect(page.getByText(/service temporarily unavailable/i)).not.toBeVisible();
    expect(consoleErrors, `console errors on ${route}: ${consoleErrors.join('; ')}`).toEqual([]);
  });
}

test('ErrorBoundary catches a forced render error without white-screening the app', async ({ page }) => {
  // web/src/components/common/RenderCrashTrigger.jsx is mounted inside
  // AppLayout's ErrorBoundary, next to <Outlet />, and throws a real Error
  // during render when this query param is present. This is what actually
  // makes this test able to fail -- previously it only set a window flag
  // that no component ever read, so the test passed even with ErrorBoundary
  // deleted entirely.
  await page.goto('http://127.0.0.1:5173/?__test_crash=1');

  // The route content area must show the ErrorBoundary fallback, not a
  // white screen or an unhandled-exception overlay.
  await expect(page.getByText(/service temporarily unavailable/i)).toBeVisible();

  // The app chrome (sidebar/topbar) must survive the crash AND remain
  // interactive -- matching how Task 3's implementer manually verified this
  // behavior, now captured as a permanent automated regression test.
  const overviewLink = page.getByRole('link', { name: 'Overview', exact: true });
  await expect(overviewLink).toBeVisible();

  const operationsLink = page.getByRole('link', { name: 'Operations Center', exact: true }).first();
  await expect(operationsLink).toBeVisible();
  await operationsLink.click();

  // Navigating away from the crashed route must actually work (proves the
  // sidebar was never disabled) and the destination route must render
  // cleanly with no leftover crash fallback.
  await expect(page).toHaveURL(/\/operations$/);
  await expect(page.getByText(/service temporarily unavailable/i)).not.toBeVisible();
});

test('the render-crash test hook cannot fire without the explicit test trigger', async ({ page }) => {
  // Guards against the hook itself becoming a real-user-visible bug: a normal
  // navigation to any route, with no special query param or window flag,
  // must never show the ErrorBoundary fallback.
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForTimeout(500);
  await expect(page.getByText(/service temporarily unavailable/i)).not.toBeVisible();
});
