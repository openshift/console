import { test, expect } from '../../../fixtures';
import { warmupSPA } from '../../../pages/base-page';
import { MastheadPage } from '../../../pages/masthead-page';
import { ServiceAccountPage } from '../../../pages/service-account-page';
import { UserPage } from '../../../pages/user-page';

test.describe('Impersonation', { tag: ['@admin'] }, () => {
  test('can impersonate users and service accounts with groups', async ({
    page,
    cleanup,
    k8sClient,
  }) => {
    const suffix = Date.now();
    const namespace = `sa-impersonation-${suffix}`;
    const serviceAccountName = `impersonation-target-${suffix}`;
    const groupName = `impersonation-group-${suffix}`;
    const secondGroupName = `impersonation-group-two-${suffix}`;
    const username = `impersonation-user-${suffix}`;
    const serviceAccountUsername = `system:serviceaccount:${namespace}:${serviceAccountName}`;
    const masthead = new MastheadPage(page);
    const serviceAccountPage = new ServiceAccountPage(page);
    const userPage = new UserPage(page);

    await test.step('Create service account and group', async () => {
      await k8sClient.createNamespace(namespace);
      await k8sClient.waitForNamespaceReady(namespace);
      cleanup.trackNamespace(namespace);
      await k8sClient.coreV1Api.createNamespacedServiceAccount({
        namespace,
        body: { metadata: { name: serviceAccountName } },
      });
      await k8sClient.customObjectsApi.createClusterCustomObject({
        group: 'user.openshift.io',
        version: 'v1',
        plural: 'groups',
        body: {
          apiVersion: 'user.openshift.io/v1',
          kind: 'Group',
          metadata: { name: groupName },
        },
      });
      cleanup.trackClusterCustomResource(groupName, 'user.openshift.io', 'v1', 'groups', 'Group');
      await k8sClient.customObjectsApi.createClusterCustomObject({
        group: 'user.openshift.io',
        version: 'v1',
        plural: 'groups',
        body: {
          apiVersion: 'user.openshift.io/v1',
          kind: 'Group',
          metadata: { name: secondGroupName },
        },
      });
      cleanup.trackClusterCustomResource(
        secondGroupName,
        'user.openshift.io',
        'v1',
        'groups',
        'Group',
      );
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

    await test.step('Impersonate user from masthead modal', async () => {
      await warmupSPA(page);
      await masthead.impersonateUser(username);
      await expect(page.getByText(`You are impersonating User ${username}`)).toBeVisible({
        timeout: 60_000,
      });
    });

    await test.step('Stop impersonating user', async () => {
      await masthead.stopImpersonating();
      await expect(page.getByText(`You are impersonating User ${username}`)).toBeHidden({
        timeout: 60_000,
      });
    });

    await test.step('Impersonate user with group from masthead modal', async () => {
      await masthead.impersonateUser(username, [groupName]);
      await expect(page.getByText(`You are impersonating user ${username}`)).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByText(`with groups: ${groupName}`)).toBeVisible({ timeout: 60_000 });
    });

    await test.step('Stop impersonating user with group', async () => {
      await masthead.stopImpersonating();
      await expect(page.getByText(`You are impersonating user ${username}`)).toBeHidden({
        timeout: 60_000,
      });
    });

    await test.step('Impersonate user with multiple groups from masthead modal', async () => {
      await masthead.impersonateUser(username, [groupName, secondGroupName]);
      await expect(page.getByText(`You are impersonating user ${username}`)).toBeVisible({
        timeout: 60_000,
      });
      await expect(
        page.getByText(`with groups: ${groupName}, ${secondGroupName}`),
      ).toBeVisible({ timeout: 60_000 });
    });

    await test.step('Stop impersonating user with multiple groups', async () => {
      await masthead.stopImpersonating();
      await expect(page.getByText(`You are impersonating user ${username}`)).toBeHidden({
        timeout: 60_000,
      });
    });

    await test.step('Impersonate service account from masthead modal', async () => {
      await masthead.impersonateServiceAccount(namespace, serviceAccountName);
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeVisible({
        timeout: 60_000,
      });
    });

    await test.step('Stop impersonating service account', async () => {
      await masthead.stopImpersonating();
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeHidden({
        timeout: 60_000,
      });
    });

    await test.step('Impersonate service account with group from masthead modal', async () => {
      await masthead.impersonateServiceAccount(namespace, serviceAccountName, [groupName]);
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByText(`with groups: ${groupName}`)).toBeVisible({ timeout: 60_000 });
    });

    await test.step('Stop impersonating service account with group', async () => {
      await masthead.stopImpersonating();
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeHidden({
        timeout: 60_000,
      });
    });

    await test.step('Impersonate service account with multiple groups from masthead modal', async () => {
      await masthead.impersonateServiceAccount(namespace, serviceAccountName, [
        groupName,
        secondGroupName,
      ]);
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeVisible({
        timeout: 60_000,
      });
      await expect(
        page.getByText(`with groups: ${groupName}, ${secondGroupName}`),
      ).toBeVisible({ timeout: 60_000 });
    });

    await test.step('Stop impersonating service account with multiple groups', async () => {
      await masthead.stopImpersonating();
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

    await test.step('Stop impersonating service account', async () => {
      await masthead.stopImpersonating();
      await expect(page.getByText(`You are impersonating ServiceAccount ${serviceAccountUsername}`)).toBeHidden({
        timeout: 60_000,
      });
    });

    await test.step('Impersonate user from resource details action', async () => {
      await userPage.navigateToDetails(username);
      await userPage.impersonateFromDetails();
      await expect(page.getByText(`You are impersonating User ${username}`)).toBeVisible({
        timeout: 60_000,
      });
    });
  });
});
