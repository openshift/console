import { test, expect } from '../../fixtures';
import {
  AddPage,
  DeployImagePage,
  TopologyPage,
} from '../../pages/dev-console/add-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/create-from-container-image.feature
 *
 * All automatable scenarios are included.
 */

test.describe(
  'Create Application from Container image',
  { tag: ['@dev-console', '@regression'] },
  () => {
    const ns = `aut-addflow-containerimg-${Date.now()}`;
    let addPage: AddPage;
    let deployPage: DeployImagePage;
    let topologyPage: TopologyPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      deployPage = new DeployImagePage(page);
      topologyPage = new TopologyPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('deploy image page details on entering external registry image [A-02-TC01]', async () => {
      await test.step('Navigate to Deploy Image page', async () => {
        await addPage.clickContainerImage();
      });

      await test.step('Enter external registry image', async () => {
        await deployPage.enterExternalRegistryImage('openshift/hello-openshift');
      });

      await test.step('Verify auto-populated fields', async () => {
        await expect(deployPage.getAppNameInput()).toHaveValue('hello-openshift-app', {
          timeout: 30_000,
        });
        await expect(deployPage.getNameInput()).toHaveValue('hello-openshift');
      });
    });

    test('cancel operation on Container image form [A-02-TC04]', async () => {
      await test.step('Navigate to Deploy Image page', async () => {
        await addPage.clickContainerImage();
      });

      await test.step('Select internal registry and cancel', async () => {
        await deployPage.selectImageStreamTag();
        await deployPage.selectProject('openshift');
        await deployPage.selectImageStream('golang');
        await deployPage.selectTag('latest');
        await deployPage.clickCancel();
      });

      await test.step('Verify redirect to Add page', async () => {
        await expect(addPage.getPageHeading()).toBeVisible();
      });
    });
  },
);

test.describe(
  'Deploy image from internal registry',
  { tag: ['@dev-console', '@smoke'] },
  () => {
    const ns = `aut-addflow-deploy-int-${Date.now()}`;
    let addPage: AddPage;
    let deployPage: DeployImagePage;
    let topologyPage: TopologyPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      deployPage = new DeployImagePage(page);
      topologyPage = new TopologyPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('deploy image from internal registry with Runtime icon [A-02-TC03]', async () => {
      test.slow();

      await test.step('Navigate to Deploy Image page', async () => {
        await addPage.clickContainerImage();
      });

      await test.step('Select internal registry image stream', async () => {
        await deployPage.selectImageStreamTag();
        await deployPage.selectProject('openshift');
        await deployPage.selectImageStream('golang');
        await deployPage.selectTag('latest');
      });

      await test.step('Configure and create deployment', async () => {
        await deployPage.selectRuntimeIcon('fedora');
        await deployPage.enterName('hello-internal');
        await deployPage.selectResourceType('deployment');
        await deployPage.clickCreate();
      });

      await test.step('Verify workload in topology', async () => {
        await topologyPage.waitForWorkload('hello-internal');
      });
    });
  },
);
