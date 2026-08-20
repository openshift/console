import { test, expect } from '../../../fixtures';
import { performLogin } from '../../../setup/login-helper';

const KUBEADMIN_IDP = 'kube:admin';
const KUBEADMIN_USERNAME = 'kubeadmin';

test.describe('Auth test', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('logs in as test user via htpasswd identity provider', async ({ page }) => {
    const htpasswdPassword = process.env.BRIDGE_HTPASSWD_PASSWORD;
    const idp = process.env.BRIDGE_HTPASSWD_IDP || 'test';
    const username = process.env.BRIDGE_HTPASSWD_USERNAME || 'test';
    const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

    test.skip(!htpasswdPassword, 'BRIDGE_HTPASSWD_PASSWORD not set');

    await performLogin(page, baseURL, username, htpasswdPassword, idp);
    await expect(page).toHaveURL(new RegExp(baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), {
      timeout: 30_000,
    });

    await test.step('Verify username is displayed', async () => {
      await expect(page.getByTestId('user-dropdown-toggle')).toHaveText(username, {
        timeout: 30_000,
      });
    });

    await test.step('Switch to Admin perspective', async () => {
      const toggle = page.getByTestId('perspective-switcher-toggle');
      await toggle.click();
      const adminOption = page
        .getByTestId('perspective-switcher-menu-option')
        .filter({ hasText: 'Core platform' });
      await adminOption.click();
      await expect(toggle).toContainText('Core platform', { timeout: 30_000 });
    });

    await test.step('Verify restricted admin nav items are not visible', async () => {
      const sidebar = page.locator('#page-sidebar');
      await expect(sidebar).toBeVisible({ timeout: 30_000 });

      for (const section of ['Compute', 'Monitoring']) {
        await expect(sidebar.getByRole('button', { name: section })).not.toBeAttached({
          timeout: 30_000,
        });
      }

      for (const link of [
        'Cluster Status',
        'Cluster Settings',
        'Namespaces',
        'Custom Resource Definitions',
        'Software Catalog',
        'Persistent Volumes',
      ]) {
        await expect(sidebar.getByRole('link', { name: link })).not.toBeAttached();
      }
    });
  });

  test('logs in as kubeadmin user', async ({ page }) => {
    const kubeadminPassword = process.env.BRIDGE_KUBEADMIN_PASSWORD;
    const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';

    test.skip(!kubeadminPassword, 'BRIDGE_KUBEADMIN_PASSWORD not set');

    await performLogin(page, baseURL, KUBEADMIN_USERNAME, kubeadminPassword!, KUBEADMIN_IDP);
    await expect(page.getByTestId('loading-indicator')).not.toBeAttached({ timeout: 30_000 });

    await test.step('Verify kubeadmin username', async () => {
      await expect(page.getByTestId('user-dropdown-toggle')).toHaveText(KUBEADMIN_IDP, {
        timeout: 30_000,
      });
    });

    await test.step('Verify temporary admin notification', async () => {
      await expect(page.getByTestId('global-notifications')).toContainText(
        'You are logged in as a temporary administrative user',
        { timeout: 30_000 },
      );
    });

    await test.step('Verify Admin perspective and nav sections', async () => {
      const toggle = page.getByTestId('perspective-switcher-toggle');
      await expect(toggle).toContainText('Core platform', { timeout: 30_000 });

      const sidebar = page.locator('#page-sidebar');
      await expect(sidebar.getByRole('button', { name: 'Compute' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(sidebar.getByRole('button', { name: 'Administration' })).toBeVisible();
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
});
