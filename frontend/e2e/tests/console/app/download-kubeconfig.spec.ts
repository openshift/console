import type { Download } from '@playwright/test';

import { test, expect } from '../../../fixtures';
import { warmupSPA } from '../../../pages/base-page';
import { MastheadPage } from '../../../pages/masthead-page';
import { ServiceAccountPage } from '../../../pages/service-account-page';

const RBAC_GROUP = 'rbac.authorization.k8s.io';

const readDownload = async (download: Download): Promise<string> => {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

test.describe('Download kubeconfig', { tag: ['@admin'] }, () => {
  test('downloads a kubeconfig for a ServiceAccount from the details Actions menu', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const suffix = Date.now();
    const namespace = `kubeconfig-sa-${suffix}`;
    const serviceAccountName = `kubeconfig-target-${suffix}`;
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

    await test.step('Download kubeconfig from the Actions menu', async () => {
      await serviceAccountPage.navigateToDetails(namespace, serviceAccountName);

      const responsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/kubeconfig') && res.request().method() === 'POST',
      );
      const downloadPromise = page.waitForEvent('download');
      await serviceAccountPage.downloadKubeconfigFromDetails();

      const response = await responsePromise;
      expect(response.status()).toBe(200);

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('kubeconfig');

      const contents = await readDownload(download);
      expect(contents).toContain('kind: Config');
      expect(contents).toContain(`system:serviceaccount:${namespace}:${serviceAccountName}`);
    });
  });

  test('downloads a kubeconfig for the current user from the masthead user menu', async ({
    page,
  }) => {
    const masthead = new MastheadPage(page);
    await warmupSPA(page);

    test.skip(
      await masthead.isAuthDisabled(),
      'Download kubeconfig for the current user requires authentication to be enabled',
    );

    await masthead.openUserDropdown();

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/kubeconfig') && res.request().method() === 'POST',
    );
    const downloadPromise = page.waitForEvent('download');
    await masthead.clickDownloadKubeconfig();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('kubeconfig');

    const contents = await readDownload(download);
    expect(contents).toContain('kind: Config');
  });

  test('hides the ServiceAccount Download kubeconfig action for a user without token-create permission', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const suffix = Date.now();
    const namespace = `kubeconfig-rbac-${suffix}`;
    const serviceAccountName = `kubeconfig-rbac-target-${suffix}`;
    const roleName = `kubeconfig-view-sa-${suffix}`;
    const bindingName = `kubeconfig-view-sa-binding-${suffix}`;
    const username = `kubeconfig-limited-user-${suffix}`;
    const masthead = new MastheadPage(page);
    const serviceAccountPage = new ServiceAccountPage(page);

    await test.step('Create service account, view-only role and limited user', async () => {
      await k8sClient.createNamespace(namespace);
      await k8sClient.waitForNamespaceReady(namespace);
      cleanup.trackNamespace(namespace);
      await k8sClient.coreV1Api.createNamespacedServiceAccount({
        namespace,
        body: { metadata: { name: serviceAccountName } },
      });
      // Role that can view service accounts but cannot create the token subresource
      await k8sClient.createCustomResource(RBAC_GROUP, 'v1', namespace, 'roles', {
        apiVersion: `${RBAC_GROUP}/v1`,
        kind: 'Role',
        metadata: { name: roleName, namespace },
        rules: [
          { apiGroups: [''], resources: ['serviceaccounts'], verbs: ['get', 'list', 'watch'] },
        ],
      });
      await k8sClient.createCustomResource(RBAC_GROUP, 'v1', namespace, 'rolebindings', {
        apiVersion: `${RBAC_GROUP}/v1`,
        kind: 'RoleBinding',
        metadata: { name: bindingName, namespace },
        subjects: [{ kind: 'User', name: username, apiGroup: RBAC_GROUP }],
        roleRef: { kind: 'Role', name: roleName, apiGroup: RBAC_GROUP },
      });
      await k8sClient.customObjectsApi.createClusterCustomObject({
        group: 'user.openshift.io',
        version: 'v1',
        plural: 'users',
        body: {
          apiVersion: 'user.openshift.io/v1',
          kind: 'User',
          metadata: { name: username },
        },
      });
      cleanup.trackClusterCustomResource(username, 'user.openshift.io', 'v1', 'users', 'User');
    });

    await test.step('Impersonate the limited user', async () => {
      await warmupSPA(page);
      await masthead.impersonateUser(username);
      await expect(page.getByText(`You are impersonating User ${username}`)).toBeVisible({
        timeout: 60_000,
      });
    });

    await test.step('Download kubeconfig action is not offered', async () => {
      await serviceAccountPage.navigateToDetails(namespace, serviceAccountName);
      await serviceAccountPage.openActionsMenu();
      await expect(serviceAccountPage.getDownloadKubeconfigAction()).toBeHidden();
    });

    await test.step('Stop impersonating', async () => {
      await masthead.stopImpersonating();
    });
  });
});
