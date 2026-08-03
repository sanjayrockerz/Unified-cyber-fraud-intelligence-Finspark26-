import { useLocation } from 'react-router-dom';

/**
 * Test-only render-crash hook.
 *
 * The plan's #2 anchor bug was app-wide crashes taking down the whole
 * dashboard; ErrorBoundary (see ErrorBoundary.jsx) fixes that, but until this
 * component existed nothing in the route tree ever actually threw during a
 * real render, so web/tests/full-crawl.spec.js's crash-injection test could
 * never fail even if ErrorBoundary were deleted outright.
 *
 * This component is mounted once, inside AppLayout's ErrorBoundary, next to
 * <Outlet />. It throws a real Error during render -- and only during
 * render -- when EITHER:
 *   - the URL has `?__test_crash=1` (a query param no real user will ever
 *     type or be linked to), or
 *   - `window.__forceRenderCrash` has been set to `true` (set only by the
 *     Playwright test harness via `page.evaluate`).
 *
 * Neither trigger can fire in a normal user session.
 */
export default function RenderCrashTrigger() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const shouldCrash = params.get('__test_crash') === '1' || window.__forceRenderCrash === true;

  if (shouldCrash) {
    throw new Error('Simulated render crash (test-only __test_crash trigger) -- this is expected, not a real bug.');
  }

  return null;
}
