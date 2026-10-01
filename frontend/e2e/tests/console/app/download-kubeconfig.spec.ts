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
      expect(download.suggestedFilename()).toBe(`kubeconfig-${namespace}-${serviceAccountName}`);

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
    // The current user's kubeconfig keeps the plain filename.
    expect(download.suggestedFilename()).toBe('kubeconfig');

    const contents = await readDownload(download);
    expect(contents).toContain('kind: Config');
  });

  test('hides the ServiceAccount Download kubeconfig action for a user without token-create permission', async ({
    page,
    cleanup,
    k8sClient,
  }, testInfo) => {
    // Two full page navigations (warmup, details), an impersonation round
    // trip, a settle wait for Console's delayed "last visited resource"
    // redirect, and cleanup of several RBAC resources add up against the
    // default per-test budget — give this one more room.
    testInfo.setTimeout(180_000);

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

    await test.step('Navigate to the ServiceAccount details page', async () => {
      await warmupSPA(page);
      await serviceAccountPage.navigateToDetails(namespace, serviceAccountName);
    });

    // Snapshot the history depth right before impersonating so we can step
    // back exactly that many entries afterwards, regardless of how many
    // navigations warmup/auth-recovery retries happened to add getting here.
    const historyLengthAtDetails = await serviceAccountPage.historyLength();

    await test.step('Impersonate the limited user', async () => {
      await masthead.impersonateUser(username);
      await expect(page.getByText(`You are impersonating User ${username}`)).toBeVisible({
        timeout: 60_000,
      });
    });

    await test.step('Download kubeconfig action is disabled', async () => {
      // Console's impersonation indicator is in-memory Redux state with no
      // cookie/localStorage/URL persistence (see
      // public/actions/ui.ts startImpersonate/stopImpersonate). A full page
      // navigation (page.goto) resets it, so we can't call
      // navigateToDetails() again here — that would silently drop
      // impersonation and the SSAR below would resolve as the real
      // (unimpersonated) admin session instead of the limited user. Going
      // back through browser history is a client-side transition handled by
      // the SPA's router, so Redux state — and therefore impersonation — is
      // preserved. This limited user also can't browse Projects or the
      // ServiceAccounts list (no RBAC for either), so history is the only
      // way back to the details page at all.
      //
      // Console also redirects to a "last visited resource" fallback some
      // time after impersonating a user with this little access, once it
      // discovers there's nothing else they can browse. That redirect can
      // fire after the impersonation banner already looks settled, so wait
      // for the URL to stop moving before reading history state — otherwise
      // the delayed redirect fires later and pulls us away from the details
      // page we just navigated back to.
      await serviceAccountPage.waitForNavigationToSettle();
      const historyLengthAfterImpersonate = await serviceAccountPage.historyLength();
      const stepsBack = historyLengthAfterImpersonate - historyLengthAtDetails;
      await serviceAccountPage.goBackSteps(stepsBack, serviceAccountName);

      // The action item itself is always rendered (ActionMenuItem never omits
      // an item with an accessReview) and only gets isDisabled toggled once
      // the SelfSubjectAccessReview resolves, so wait for that specific
      // review before asserting disabled rather than racing its initial
      // (enabled) state.
      const tokenAccessReview = page.waitForResponse((response) => {
        if (
          response.request().method() !== 'POST' ||
          !response.url().includes('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
        ) {
          return false;
        }
        const attributes = response.request().postDataJSON()?.spec?.resourceAttributes;
        return (
          response.ok() &&
          attributes?.verb === 'create' &&
          attributes?.resource === 'serviceaccounts' &&
          attributes?.subresource === 'token' &&
          attributes?.namespace === namespace &&
          attributes?.name === serviceAccountName
        );
      });

      await serviceAccountPage.openActionsMenu();
      await tokenAccessReview;
      await expect(serviceAccountPage.getDownloadKubeconfigAction()).toBeDisabled({
        timeout: 30_000,
      });
    });
  });
});
