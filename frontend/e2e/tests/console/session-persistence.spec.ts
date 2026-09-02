import { test, expect } from '../../fixtures';
import { loginFromEnv } from '../../setup/login-helper';

const CONSOLE_NAMESPACE = 'openshift-console';
const CONSOLE_DEPLOYMENT = 'console';

test.describe(
  'Session persistence across pod restarts',
  {
    tag: ['@admin', '@slow'],
    // Opt out of the page fixture's transparent OAuth re-auth: these tests
    // assert the session survives on its own, so auto-recovery would mask a
    // real regression.
    annotation: { type: 'no-auto-reauth', description: 'asserts session survival directly' },
  },
  () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test.setTimeout(300_000);

    test('session survives console pod deletion', async ({ page, k8sClient }) => {
      await test.step('Log in to the console', async () => {
        // These are @admin tests, so always authenticate as the admin persona
        // regardless of whether developer (htpasswd) credentials are configured.
        test.skip(
          !process.env.BRIDGE_KUBEADMIN_PASSWORD,
          'No kubeadmin credentials configured',
        );
        await loginFromEnv(page, 'admin');

        await expect(page.getByTestId('user-dropdown-toggle')).toBeVisible({ timeout: 60_000 });
      });

      await test.step('Verify dashboard loads', async () => {
        await page.goto('/dashboards', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveTitle(/Overview/);
      });

      await test.step('Delete all console pods', async () => {
        const pods = await k8sClient.getPods(CONSOLE_NAMESPACE);
        const consolePods = pods.filter(
          (p) => p.metadata?.labels?.['component'] === 'ui',
        );

        expect(consolePods.length).toBeGreaterThan(0);

        for (const pod of consolePods) {
          await k8sClient.deletePod(pod.metadata!.name!, CONSOLE_NAMESPACE);
        }
      });

      await test.step('Wait for new console pods to be ready', async () => {
        await k8sClient.waitForDeploymentReady(CONSOLE_DEPLOYMENT, CONSOLE_NAMESPACE, 180_000);
      });

      await test.step('Verify session persisted — no login redirect', async () => {
        await page.goto('/k8s/cluster/nodes', {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });

        await expect(page.getByTestId('user-dropdown-toggle')).toBeVisible({ timeout: 30_000 });
        await expect(page).toHaveTitle(/Nodes/);
        expect(page.url()).not.toContain('oauth-openshift');
        expect(page.url()).not.toContain('/login');
      });
    });

    test('session survives console plugin toggle', async ({ page, k8sClient }) => {
      await test.step('Log in to the console', async () => {
        // These are @admin tests, so always authenticate as the admin persona
        // regardless of whether developer (htpasswd) credentials are configured.
        test.skip(
          !process.env.BRIDGE_KUBEADMIN_PASSWORD,
          'No kubeadmin credentials configured',
        );
        await loginFromEnv(page, 'admin');

        await expect(page.getByTestId('user-dropdown-toggle')).toBeVisible({ timeout: 60_000 });
      });

      let pluginName: string | undefined;

      await test.step('Find an enabled ConsolePlugin to toggle', async () => {
        const consoleOperator = await k8sClient.customObjectsApi.getClusterCustomObject({
          group: 'operator.openshift.io',
          version: 'v1',
          plural: 'consoles',
          name: 'cluster',
        });

        const plugins: string[] =
          (consoleOperator.body as any)?.spec?.plugins ?? [];
        pluginName = plugins[0];
        test.skip(!pluginName, 'No enabled ConsolePlugins found on this cluster');
      });

      await test.step('Disable the plugin via operator config', async () => {
        const consoleOperator = await k8sClient.customObjectsApi.getClusterCustomObject({
          group: 'operator.openshift.io',
          version: 'v1',
          plural: 'consoles',
          name: 'cluster',
        });

        const currentPlugins: string[] =
          (consoleOperator.body as any)?.spec?.plugins ?? [];
        const updatedPlugins = currentPlugins.filter((p: string) => p !== pluginName);

        await k8sClient.mergePatchResource(
          '/apis/operator.openshift.io/v1/consoles/cluster',
          { spec: { plugins: updatedPlugins } },
        );
      });

      await test.step('Wait for console rollout', async () => {
        // The operator triggers a new rollout when plugin config changes.
        // Delete the console pods to force immediate restart, then wait for readiness.
        const pods = await k8sClient.getPods(CONSOLE_NAMESPACE);
        const consolePods = pods.filter(
          (p) => p.metadata?.labels?.['component'] === 'ui',
        );
        for (const pod of consolePods) {
          await k8sClient.deletePod(pod.metadata!.name!, CONSOLE_NAMESPACE);
        }
        await k8sClient.waitForDeploymentReady(CONSOLE_DEPLOYMENT, CONSOLE_NAMESPACE, 180_000);
      });

      await test.step('Verify session persisted after plugin toggle', async () => {
        await page.goto('/dashboards', {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });

        await expect(page.getByTestId('user-dropdown-toggle')).toBeVisible({ timeout: 30_000 });
        await expect(page).toHaveTitle(/Overview/);
        expect(page.url()).not.toContain('oauth-openshift');
        expect(page.url()).not.toContain('/login');
      });

      await test.step('Re-enable the plugin', async () => {
        const consoleOperator = await k8sClient.customObjectsApi.getClusterCustomObject({
          group: 'operator.openshift.io',
          version: 'v1',
          plural: 'consoles',
          name: 'cluster',
        });

        const currentPlugins: string[] =
          (consoleOperator.body as any)?.spec?.plugins ?? [];
        if (!currentPlugins.includes(pluginName!)) {
          currentPlugins.push(pluginName!);
          await k8sClient.mergePatchResource(
            '/apis/operator.openshift.io/v1/consoles/cluster',
            { spec: { plugins: currentPlugins } },
          );
        }
      });
    });
  },
);
