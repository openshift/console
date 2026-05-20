import { test } from '../../fixtures';
import KubernetesClient from '../../clients/kubernetes-client';
import { PerspectivePage } from '../../pages/dev-console/perspective-page';
import { CustomizationPage } from '../../pages/dev-console/customization-page';

test.describe(
  'Customization of pre-pinned resources',
  { tag: ['@regression', '@dev-console'] },
  () => {
    const namespace = `aut-pinned-resources-${Date.now()}`;
    let k8s: KubernetesClient;

    test.beforeAll(async () => {
      k8s = new KubernetesClient({
        clusterUrl: process.env.CLUSTER_URL || '',
        username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
        password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
      });
      await k8s.createNamespace(namespace);
    });

    test.afterAll(async () => {
      await k8s.deleteNamespace(namespace);
    });

    test('navigating to cluster configuration page shows pinned resources section', async ({
      page,
    }) => {
      const perspectivePage = new PerspectivePage(page);
      const customizationPage = new CustomizationPage(page);

      await test.step('Navigate to developer perspective', async () => {
        await page.goto('/');
        await perspectivePage.switchToDeveloper();
        await perspectivePage.selectOrCreateProject(namespace);
      });

      await test.step('Navigate to Consoles and open customization', async () => {
        await customizationPage.navigateToConsoles();
        await customizationPage.clickCluster();
        await customizationPage.openCustomization();
      });

      await test.step('Click Developer tab and verify pinned resources section', async () => {
        await customizationPage.clickDeveloperTab();
        await customizationPage.expectPinnedResourceSection();
      });
    });

    test('when pre-pinned resources customization is not added', async () => {
      test.skip(true, 'Manual test — requires YAML verification of cluster console resource');
    });

    test('when resource is selected for pre-pinned navigation', async () => {
      test.skip(true, 'Manual test — requires YAML verification of cluster console resource');
    });

    test('when resource is removed from pre-pinned navigation', async () => {
      test.skip(true, 'Manual test — requires YAML verification of cluster console resource');
    });
  },
);
