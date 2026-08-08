import { test, expect } from '../../fixtures';
import { performLogin } from '../../setup/login-helper';

const CONSOLE_NAMESPACE = 'openshift-console';
const CONSOLE_DEPLOYMENT = 'console';

test.describe(
  'Session persistence across pod restarts',
  { tag: ['@admin', '@slow'] },
  () => {
    test.setTimeout(300_000);

    test('session survives console pod deletion', async ({ page, k8sClient }) => {
      const baseURL = process.env.WEB_CONSOLE_URL || page.url() || 'http://localhost:9000';

      await test.step('Log in to the console', async () => {
        const htpasswdUser = process.env.BRIDGE_HTPASSWD_USERNAME;
        const htpasswdPass = process.env.BRIDGE_HTPASSWD_PASSWORD;
        const htpasswdIdp = process.env.BRIDGE_HTPASSWD_IDP;

        if (htpasswdUser && htpasswdPass) {
          await performLogin(page, baseURL, htpasswdUser, htpasswdPass, htpasswdIdp);
        } else {
          const kubeadminPassword = process.env.BRIDGE_KUBEADMIN_PASSWORD;
          test.skip(!kubeadminPassword, 'No credentials configured');
          await performLogin(page, baseURL, 'kubeadmin', kubeadminPassword!, 'kube:admin');
        }

        await expect(page.getByTestId('user-dropdown-toggle')).toBeVisible({ timeout: 60_000 });
      });

      await test.step('Verify dashboard loads', async () => {
        await page.goto(`${baseURL}/dashboards`, { waitUntil: 'domcontentloaded' });
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
        await page.goto(`${baseURL}/k8s/cluster/nodes`, {
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
      const baseURL = process.env.WEB_CONSOLE_URL || page.url() || 'http://localhost:9000';

      await test.step('Log in to the console', async () => {
        const htpasswdUser = process.env.BRIDGE_HTPASSWD_USERNAME;
        const htpasswdPass = process.env.BRIDGE_HTPASSWD_PASSWORD;
        const htpasswdIdp = process.env.BRIDGE_HTPASSWD_IDP;

        if (htpasswdUser && htpasswdPass) {
          await performLogin(page, baseURL, htpasswdUser, htpasswdPass, htpasswdIdp);
        } else {
          const kubeadminPassword = process.env.BRIDGE_KUBEADMIN_PASSWORD;
          test.skip(!kubeadminPassword, 'No credentials configured');
          await performLogin(page, baseURL, 'kubeadmin', kubeadminPassword!, 'kube:admin');
        }

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
        // The operator triggers a new rollout when plugin config changes
        // Wait briefly for the rollout to start, then wait for it to complete
        await page.waitForTimeout(10_000);
        await k8sClient.waitForDeploymentReady(CONSOLE_DEPLOYMENT, CONSOLE_NAMESPACE, 180_000);
      });

      await test.step('Verify session persisted after plugin toggle', async () => {
        await page.goto(`${baseURL}/dashboards`, {
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
