import { test, expect } from '../../../fixtures';
import { LoginPage } from '../../../pages/login-page';
import { MastheadPage } from '../../../pages/masthead-page';
import { NavPage } from '../../../pages/nav-page';

const KUBEADMIN_IDP = 'kube:admin';
const KUBEADMIN_USERNAME = 'kubeadmin';

test.describe('Auth test', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("logs in as 'test' user via htpasswd identity provider", async ({ page }) => {
    const kubeadminPassword = process.env.BRIDGE_KUBEADMIN_PASSWORD;
    const htpasswdPassword = process.env.BRIDGE_HTPASSWD_PASSWORD;

    if (!kubeadminPassword || !htpasswdPassword) {
      test.skip();
      return;
    }

    const idp = process.env.BRIDGE_HTPASSWD_IDP || 'test';
    const username = process.env.BRIDGE_HTPASSWD_USERNAME || 'test';
    const passwd = htpasswdPassword || 'test';

    const loginPage = new LoginPage(page);
    const masthead = new MastheadPage(page);
    const nav = new NavPage(page);

    await test.step('Login as test user', async () => {
      const loggedIn = await loginPage.loginAs(idp, username, passwd);
      if (!loggedIn) {
        test.skip(true, 'Auth is disabled - skipping auth test');
      }
    });

    await test.step('Verify user logged in', async () => {
      await masthead.usernameShouldHaveText(username);
    });

    await test.step('Switch to Core platform perspective', async () => {
      await nav.changePerspectiveTo('Core platform');
      await nav.perspectiveSwitcherShouldHaveText('Core platform');
    });

    await test.step('Verify test user has restricted access', async () => {
      await nav.shouldNotHaveNavSection(['Administration', 'Cluster Status']);
      await nav.shouldNotHaveNavSection(['Administration', 'Cluster Settings']);
      await nav.shouldNotHaveNavSection(['Administration', 'Namespaces']);
      await nav.shouldNotHaveNavSection(['Administration', 'Custom Resource Definitions']);
      await nav.shouldNotHaveNavSection(['Ecosystem', 'Software Catalog']);
      await nav.shouldNotHaveNavSection(['Storage', 'Persistent Volumes']);
      await nav.shouldNotHaveNavSection(['Compute']);
      await nav.shouldNotHaveNavSection(['Monitoring']);
    });
  });

  test("log in as 'kubeadmin' user", async ({ page }) => {
    const kubeadminPassword = process.env.BRIDGE_KUBEADMIN_PASSWORD;
    if (!kubeadminPassword) {
      test.skip();
      return;
    }

    const loginPage = new LoginPage(page);
    const masthead = new MastheadPage(page);
    const nav = new NavPage(page);

    await test.step('Login as kubeadmin', async () => {
      const loggedIn = await loginPage.loginAs(
        KUBEADMIN_IDP,
        KUBEADMIN_USERNAME,
        kubeadminPassword,
      );
      if (!loggedIn) {
        test.skip(true, 'Auth is disabled - skipping auth test');
      }
    });

    await test.step('Verify kubeadmin logged in', async () => {
      await expect(masthead.loadingIndicator).toBeHidden();
      await masthead.usernameShouldHaveText(KUBEADMIN_IDP);
      await expect(masthead.globalNotifications).toContainText(
        'You are logged in as a temporary administrative user.',
      );
    });

    await test.step('Verify Core platform perspective', async () => {
      await nav.perspectiveSwitcherShouldHaveText('Core platform');

      const baseURL = process.env.WEB_CONSOLE_URL || 'http://localhost:9000';
      if (!baseURL.includes('localhost')) {
        await nav.changePerspectiveTo('Core platform');
        await nav.perspectiveSwitcherShouldHaveText('Core platform');
      }
    });

    await test.step('Verify kubeadmin has admin access', async () => {
      await nav.shouldHaveNavSection(['Compute']);
      await nav.shouldHaveNavSection(['Operators']);
      await nav.clickNavLink(['Administration', 'Cluster Settings']);
      await expect(nav.clusterSettingsHeading).toBeVisible();
    });
  });
});
