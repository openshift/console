import { test, expect } from '../../../fixtures';
import { trackCSPViolations } from '../../../fixtures/csp-violation-tracker';

// Run once for each Bridge mode, including again after rolling back to report-only.
const mode = process.env.EXPECTED_CSP_MODE || 'report-only';
const enforcing = mode === 'enforce';
const headerName = enforcing ? 'content-security-policy' : 'content-security-policy-report-only';

// This reserved test origin is fulfilled locally and never contacts an external server.
const scriptURL = 'https://undeclared-csp-source.test/script.js';

test.describe('CSP mode', { tag: ['@admin'] }, () => {
  test.beforeAll(() => {
    expect(['report-only', 'enforce']).toContain(mode);
  });

  test('Console loads with the configured CSP header', async ({ page }) => {
    const response = await page.goto('./');
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers[headerName]).toContain("script-src 'self'");
    expect(headers[headerName]).toContain("'unsafe-inline'");
    expect(
      headers[enforcing ? 'content-security-policy-report-only' : 'content-security-policy'],
    ).toBeUndefined();
    await expect(page.getByTestId('masthead-logo')).toBeVisible();
  });

  test('Undeclared scripts follow the configured CSP mode', async ({
    page: authenticatedPage,
    context,
    baseURL,
  }) => {
    // Recover an expired session through the shared fixture before opening another
    // page in the same authenticated context.
    await authenticatedPage.goto('./');
    // Use a separate page so the shared page fixture continues to reject unexpected
    // violations in ordinary Console workflows. Here a violation is intentional.
    const page = await context.newPage();
    try {
      const { violations, waitForPendingReports } = await trackCSPViolations(page, baseURL);
      await page.route(scriptURL, (route) =>
        route.fulfill({
          contentType: 'application/javascript',
          body: "document.documentElement.dataset.cspScriptExecuted = 'true';",
        }),
      );
      const response = await page.goto('./');
      expect(response.headers()[headerName]).toContain('report-uri');
      await expect(page.getByTestId('masthead-logo')).toBeVisible();

      const result = await page.evaluate(
        (src) =>
          new Promise<'loaded' | 'blocked'>((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve('loaded');
            script.onerror = () => resolve('blocked');
            document.head.appendChild(script);
          }),
        scriptURL,
      );
      expect(result).toBe(enforcing ? 'blocked' : 'loaded');
      expect(await page.evaluate(() => document.documentElement.dataset.cspScriptExecuted)).toBe(
        enforcing ? undefined : 'true',
      );
      await expect
        .poll(async () => {
          await waitForPendingReports();
          return violations.map(({ 'csp-report': report }) => report);
        })
        .toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              blockedURI: expect.stringContaining(new URL(scriptURL).origin),
              effectiveDirective: 'script-src-elem',
              disposition: enforcing ? 'enforce' : 'report',
            }),
          ]),
        );
    } finally {
      await page.close();
    }
  });
});
