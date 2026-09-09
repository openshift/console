import { test, expect } from '../../fixtures';
import type KubernetesClient from '../../clients/kubernetes-client';
import { DetailsPage } from '../../pages/details-page';
import { DeploymentPage } from '../../pages/dev-console/deployment-page';
import { DeployImagePage } from '../../pages/dev-console/add-page';

async function waitForDeploymentCreated(
  k8sClient: KubernetesClient,
  namespace: string,
): Promise<string> {
  await expect
    .poll(
      async () => {
        const response = await k8sClient.appsV1Api.listNamespacedDeployment({ namespace });
        return response.items?.length ?? 0;
      },
      { timeout: 60_000 },
    )
    .toBeGreaterThan(0);
  const response = await k8sClient.appsV1Api.listNamespacedDeployment({ namespace });
  const name = response.items[0]?.metadata?.name;
  if (!name) throw new Error(`Deployment was created in ${namespace} without a name`);
  return name;
}

test.describe('Deployment form view', { tag: ['@dev-console', '@smoke'] }, () => {
  const strategies = ['Rolling Update', 'Recreate'];

  test('D-01-TC02: Create deployment using ImageStream', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-deploy-imagestream-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    expect(await k8sClient.waitForNamespaceReady(ns), 'Namespace did not become ready').toBe(true);
    cleanup.trackNamespace(ns);
    const deployPage = new DeployImagePage(page);
    await deployPage.navigateToDeployImage(ns);
    await deployPage.selectImageStreamTag();
    await deployPage.selectProject('openshift');
    await deployPage.selectImageStream('httpd');
    await deployPage.selectTag('latest');
    await deployPage.enterName('image-stream-deployment');
    await deployPage.clickCreate();
    const deploymentName = await waitForDeploymentCreated(k8sClient, ns);
    const detailsPage = new DetailsPage(page);
    await detailsPage.navigateToDetailsUrl(`/k8s/ns/${ns}/deployments/${deploymentName}`);
    await expect(detailsPage.title).toContainText(deploymentName);
  });

  test('D-01-TC03: Create and edit deployment, verify auto-deploy persistence', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-deploy-edit-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    expect(await k8sClient.waitForNamespaceReady(ns), 'Namespace did not become ready').toBe(true);
    cleanup.trackNamespace(ns);
    const deployImagePage = new DeployImagePage(page);
    await deployImagePage.navigateToDeployImage(ns);
    await deployImagePage.selectImageStreamTag();
    await deployImagePage.selectProject('openshift');
    await deployImagePage.selectImageStream('httpd');
    await deployImagePage.selectTag('latest');
    await deployImagePage.enterName('editable-deployment');
    await deployImagePage.clickCreate();
    const deploymentName = await waitForDeploymentCreated(k8sClient, ns);
    const deployPage = new DeploymentPage(page);
    await deployPage.navigateToEditForm(ns, deploymentName);
    await deployPage.reloadIfStale();
    const autoDeploy = deployPage.getAutoDeployImage();
    if (!(await autoDeploy.isChecked())) {
      await autoDeploy.check();
      await deployPage.save();
    }
    await deployPage.navigateToEditForm(ns, deploymentName);
    await expect(deployPage.getAutoDeployImage()).toBeChecked();
  });

  for (const strategyName of strategies) {
    test(`creates deployment with ${strategyName} strategy`, async ({
      page,
      k8sClient,
      cleanup,
    }) => {
      const ns = `aut-deploy-${strategyName.replace(/\s+/g, '').toLowerCase()}-${Date.now()}`;
      const deploymentName = 'test-deploy';
      const deploymentPage = new DeploymentPage(page);
      const detailsPage = new DetailsPage(page);

      await test.step('Set up namespace', async () => {
        await k8sClient.createNamespace(ns);
        expect(await k8sClient.waitForNamespaceReady(ns), 'Namespace did not become ready').toBe(
          true,
        );
        cleanup.trackNamespace(ns);
      });

      await test.step('Fill deployment form', async () => {
        await deploymentPage.navigateToCreateForm(ns);
        await deploymentPage.fillName(deploymentName);
        await deploymentPage.selectStrategy(strategyName);
        await deploymentPage.fillImage(
          'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
        );
      });

      await test.step('Submit and verify', async () => {
        await deploymentPage.create();
        await detailsPage.waitForPageLoad();
        await expect(detailsPage.title).toContainText(deploymentName);
      });
    });
  }
});
