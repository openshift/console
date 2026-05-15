import type KubernetesClient from '../../clients/kubernetes-client';
import { test, expect } from '../../fixtures';
import { ModalPage } from '../../pages/modal-page';
import { OperatorHubPage } from '../../pages/olm/operator-hub-page';

const OPERATOR_SUBSCRIPTION = '3scale-operator';

async function cleanupOperator(k8sClient: KubernetesClient, namespace: string): Promise<void> {
  await k8sClient
    .deleteCustomResource(
      'operators.coreos.com',
      'v1alpha1',
      namespace,
      'subscriptions',
      OPERATOR_SUBSCRIPTION,
    )
    .catch(() => {});

  const csvs = await k8sClient.listCustomResources(
    'operators.coreos.com',
    'v1alpha1',
    namespace,
    'clusterserviceversions',
  );
  for (const csv of csvs) {
    const name = (csv as any)?.metadata?.name;
    if (name?.startsWith('3scale-operator')) {
      await k8sClient
        .deleteCustomResource(
          'operators.coreos.com',
          'v1alpha1',
          namespace,
          'clusterserviceversions',
          name,
        )
        .catch(() => {});
    }
  }
}

test.describe('Create namespace from operator install', { tag: ['@admin'] }, () => {
  const testNs = `olm-create-ns-${Date.now()}`;
  const nsName = `${testNs}-ns`;

  test.beforeAll(async ({ k8sClient }) => {
    await cleanupOperator(k8sClient, 'openshift-operators');
  });

  test.afterAll(async ({ k8sClient }) => {
    await cleanupOperator(k8sClient, nsName);
    await cleanupOperator(k8sClient, 'openshift-operators');
    await k8sClient.deleteNamespace(nsName).catch(() => {});
    await k8sClient.deleteNamespace(testNs).catch(() => {});
  });

  test('creates namespace from operator install page', async ({ page, k8sClient, cleanup }) => {
    await k8sClient.createNamespace(testNs);
    cleanup.trackNamespace(testNs);

    const operatorHubPage = new OperatorHubPage(page);
    const modalPage = new ModalPage(page);

    await test.step('Navigate to OperatorHub and select 3scale operator', async () => {
      await operatorHubPage.navigateToCatalog(testNs);
      await operatorHubPage.searchOperator('Red Hat Integration - 3scale');
      await expect(page).toHaveURL(/keyword/);
      await operatorHubPage.clickOperatorTile('operator-Red Hat Integration - 3scale');
      await operatorHubPage.clickInstallButton();
    });

    await test.step('Verify install form and select single namespace mode', async () => {
      await operatorHubPage.verifyInstallFormLoaded();
      const specificNsRadio = page.getByTestId('A specific namespace on the cluster-radio-input');
      await specificNsRadio.waitFor({ state: 'visible' });
      await specificNsRadio.check();
      const selectNsRadio = page.getByTestId('Select a Namespace-radio-input');
      if ((await selectNsRadio.count()) > 0) {
        await selectNsRadio.check();
      }
    });

    await test.step('Open Create Namespace modal and create namespace', async () => {
      await operatorHubPage.openCreateNamespaceModal();
      await modalPage.shouldBeOpened();
      await page.getByTestId('input-name').fill(nsName);
      await modalPage.submit();
      await modalPage.shouldBeClosed();
      cleanup.trackNamespace(nsName);
    });

    await test.step('Verify namespace is selected and install operator', async () => {
      await operatorHubPage.selectInstallMode('namespace', nsName);
      await operatorHubPage.submitInstall();
      await expect(page.getByTestId('view-installed-operators-btn')).toContainText(
        `View installed Operators in Namespace ${nsName}`,
      );
    });
  });
});
