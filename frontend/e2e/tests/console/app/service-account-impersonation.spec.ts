import { test, expect } from '../../../fixtures';
import { warmupSPA } from '../../../pages/base-page';
import { MastheadPage } from '../../../pages/masthead-page';
import { ServiceAccountPage } from '../../../pages/service-account-page';

test.describe('ServiceAccount impersonation', { tag: ['@admin'] }, () => {
  test('can impersonate a service account from the masthead and resource actions', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const suffix = Date.now();
    const namespace = `sa-impersonation-${suffix}`;
    const serviceAccountName = `impersonation-target-${suffix}`;
    const serviceAccountUsername = `system:serviceaccount:${namespace}:${serviceAccountName}`;
    const masthead = new MastheadPage(page);
    const serviceAccountPage = new ServiceAccountPage(page);

    await test.step('Create service account', async () => {
      await k8sClient.createNamespace(namespace);
      await k8sClient.waitForNamespaceReady(namespace);
      cleanup.trackNamespace(namespace);
      await k8sClient.coreV1Api.createNamespacedServiceAccount({
        namespace,
        body: { metadata: { name: serviceAccountName } },
      });
    });

    await test.step('Impersonate service account from masthead modal', async () => {
      await warmupSPA(page);
      await masthead.impersonateServiceAccount(namespace, serviceAccountName);
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeVisible({
        timeout: 60_000,
      });
    });

    await test.step('Stop impersonating', async () => {
      await masthead.stopImpersonating();
      await expect(page).toHaveURL(/\/$/, { timeout: 60_000 });
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeHidden({
        timeout: 60_000,
      });
    });

    await test.step('Impersonate service account from resource details action', async () => {
      await serviceAccountPage.navigateToDetails(namespace, serviceAccountName);
      await serviceAccountPage.impersonateFromDetails();
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeVisible({
        timeout: 60_000,
      });
    });
  });
});
