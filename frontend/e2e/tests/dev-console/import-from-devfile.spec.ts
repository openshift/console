import { test, expect } from '../../fixtures';
import {
  AddPage,
  ImportFromGitPage,
  TopologyPage,
} from '../../pages/dev-console/add-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/create-from-devfile.feature
 *
 * Skipped scenarios:
 *   - A-04-TC03 (@broken-test) - No service shown in node sidebar
 *   - A-04-TC04 (@broken-test) - No route shown in node sidebar
 *   - A-04-TC05 (@to-do) - Create Devfiles workload from Software Catalog
 */

test.describe(
  'Create Application from Devfile',
  { tag: ['@dev-console', '@regression'] },
  () => {
    const ns = `aut-addflow-devfile-${Date.now()}`;
    let addPage: AddPage;
    let gitPage: ImportFromGitPage;
    let topologyPage: TopologyPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      gitPage = new ImportFromGitPage(page);
      topologyPage = new TopologyPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('deploy git workload with devfile from add page [A-04-TC02]', async () => {
      test.slow();

      await test.step('Navigate to Import from Git form', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Fill out the devfile import form', async () => {
        await gitPage.enterGitRepoURL(
          'https://github.com/nodeshift-starters/devfile-sample',
        );
        await gitPage.waitForGitValidation();
        await expect(gitPage.getDevfileStrategySelected()).toBeVisible({ timeout: 30_000 });
        await gitPage.enterWorkloadName('node-example');
        await gitPage.clickCreate();
      });

      await test.step('Verify workload appears in topology', async () => {
        await topologyPage.waitForWorkload('node-example');
        await topologyPage.clickWorkload('node-example');
        await expect(topologyPage.getSidebarTitle()).toContainText('node-example');
      });
    });
  },
);
