import { test, expect } from '../../fixtures';
import { DetailsPage } from '../../pages/details-page';
import { DeploymentPage } from '../../pages/dev-console/deployment-page';

test.describe('Deployment form view', { tag: ['@dev-console', '@smoke'] }, () => {
  const strategies = ['Rolling Update', 'Recreate'];

  test.skip(true, 'D-01-TC02: Create deployment using ImageStream — deferred to a future batch');
  test.skip(true, 'D-01-TC03: Create and edit deployment, verify auto-deploy persistence — deferred to a future batch');

  for (const strategyName of strategies) {
    test(`creates deployment with ${strategyName} strategy`, async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-deploy-${strategyName.replace(/\s+/g, '').toLowerCase()}-${Date.now()}`;
      const deploymentName = 'test-deploy';
      const deploymentPage = new DeploymentPage(page);
      const detailsPage = new DetailsPage(page);

      await test.step('Set up namespace', async () => {
        await k8sClient.createNamespace(ns);
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
