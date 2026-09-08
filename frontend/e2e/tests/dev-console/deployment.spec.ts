import { test, expect } from '../../fixtures';
import { DetailsPage } from '../../pages/details-page';
import { DeploymentPage } from '../../pages/dev-console/deployment-page';
import { DeployImagePage } from '../../pages/dev-console/add-page';

test.describe('Deployment form view', { tag: ['@dev-console', '@smoke'] }, () => {
  const strategies = ['Rolling Update', 'Recreate'];

  test('D-01-TC02: Create deployment using ImageStream', async ({ page, k8sClient, cleanup }) => {
    const ns = `aut-deploy-imagestream-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    await k8sClient.waitForNamespaceReady(ns);
    cleanup.trackNamespace(ns);
    const deployPage = new DeployImagePage(page);
    await deployPage.navigateToDeployImage(ns);
    await deployPage.selectImageStreamTag();
    await deployPage.selectProject('openshift');
    await deployPage.selectImageStream('httpd');
    await deployPage.selectTag('latest');
    await deployPage.enterName('image-stream-deployment');
    await deployPage.clickCreate();
    await expect(new DetailsPage(page).title).toContainText('image-stream-deployment', {
      timeout: 30_000,
    });
  });

  test('D-01-TC03: Create and edit deployment, verify auto-deploy persistence', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `aut-deploy-edit-${Date.now()}`;
    await k8sClient.createNamespace(ns);
    await k8sClient.waitForNamespaceReady(ns);
    cleanup.trackNamespace(ns);
    const deployPage = new DeploymentPage(page);
    await deployPage.navigateToCreateForm(ns);
    await deployPage.fillName('editable-deployment');
    await deployPage.selectStrategy('Rolling Update');
    await deployPage.fillImage(
      'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
    );
    await deployPage.create();
    const detailsPage = new DetailsPage(page);
    await detailsPage.waitForPageLoad();
    await deployPage.navigateToEditForm(ns, 'editable-deployment');
    const autoDeploy = deployPage.getAutoDeployImage();
    if (!(await autoDeploy.isChecked())) await autoDeploy.check();
    await deployPage.save();
    await deployPage.navigateToEditForm(ns, 'editable-deployment');
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
        await k8sClient.waitForNamespaceReady(ns);
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
