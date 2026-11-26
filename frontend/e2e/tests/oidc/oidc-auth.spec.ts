import { test, expect } from '../../fixtures';
import { performLogin } from '../../setup/login-helper';

test.describe('External OIDC Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(() => {
    test.skip(
      process.env.BRIDGE_AUTH_TYPE !== 'oidc',
      'Requires BRIDGE_AUTH_TYPE=oidc (external OIDC cluster)',
    );
  });

  test('logs in as admin via Keycloak and verifies dashboard', async ({ page }) => {
    const username = process.env.OPENSHIFT_USERNAME;
    const password = process.env.BRIDGE_KUBEADMIN_PASSWORD;
    const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

    test.skip(!username || !password, 'Admin credentials not configured');

    await performLogin(page, baseURL, username!, password!);

    await test.step('Verify user menu shows logged-in username', async () => {
      const userMenu = page.getByTestId('user-dropdown-toggle');
      await expect(userMenu).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Verify console dashboard loads', async () => {
      await expect(page.getByTestId('loading-indicator')).not.toBeAttached({ timeout: 30_000 });
    });
  });

  test('admin user has cluster-admin privileges', async ({ page }) => {
    const username = process.env.OPENSHIFT_USERNAME;
    const password = process.env.BRIDGE_KUBEADMIN_PASSWORD;
    const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

    test.skip(!username || !password, 'Admin credentials not configured');

    await performLogin(page, baseURL, username!, password!);

    await test.step('Verify Administration section is visible', async () => {
      const sidebar = page.locator('#page-sidebar');
      await expect(sidebar.getByRole('button', { name: 'Administration' })).toBeVisible({
        timeout: 30_000,
      });
    });

    await test.step('Navigate to Cluster Settings', async () => {
      const sidebar = page.locator('#page-sidebar');
      const adminSection = sidebar.getByRole('button', { name: 'Administration' });
      await adminSection.click();
      await sidebar.getByRole('link', { name: 'Cluster Settings' }).click();
      await expect(page.getByTestId('cluster-settings-page-heading')).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test('logs in as developer via Keycloak and verifies developer perspective', async ({ page }) => {
    const username = process.env.BRIDGE_HTPASSWD_USERNAME;
    const password = process.env.BRIDGE_HTPASSWD_PASSWORD;
    const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

    test.skip(!username || !password, 'Developer credentials not configured');

    await performLogin(page, baseURL, username!, password!);

    await test.step('Verify username is displayed', async () => {
      await expect(page.getByTestId('user-dropdown-toggle')).toHaveText(username!, {
        timeout: 30_000,
      });
    });

    await test.step('Switch to Developer perspective', async () => {
      const toggle = page.getByTestId('perspective-switcher-toggle');
      await toggle.click();
      const devOption = page
        .getByTestId('perspective-switcher-menu-option')
        .filter({ hasText: 'Developer' });
      await devOption.click();
      await expect(toggle).toContainText('Developer', { timeout: 30_000 });
    });
  });

  test('logout redirects to login page', async ({ page }) => {
    const username = process.env.OPENSHIFT_USERNAME;
    const password = process.env.BRIDGE_KUBEADMIN_PASSWORD;
    const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

    test.skip(!username || !password, 'Admin credentials not configured');

    await performLogin(page, baseURL, username!, password!);

    const userMenu = page.getByTestId('user-dropdown-toggle');
    await expect(userMenu).toBeVisible({ timeout: 30_000 });

    await test.step('Click user menu and log out', async () => {
      await userMenu.click();
      const logoutButton = page.getByTestId('log-out');
      await expect(logoutButton).toBeVisible({ timeout: 10_000 });
      await logoutButton.click();
    });

    await test.step('Verify redirect to Keycloak or login page', async () => {
      // After logout, the browser should redirect to the Keycloak login page
      // or the console login route. Wait for a URL containing a Keycloak realm
      // path or the console's auth route.
      await page.waitForURL(/\/realms\/|\/protocol\/openid-connect\/|\/auth\/login\b|\/oauth\//, {
        timeout: 60_000,
      });
    });
  });
});
