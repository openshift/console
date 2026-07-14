import { test, expect } from '../../fixtures';
import {
  AddPage,
  ImportFromGitPage,
  TopologyPage,
} from '../../pages/dev-console/add-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/create-from-docker-file.feature
 *
 * Skipped scenarios:
 *   - A-05-TC02 (@manual) - Create workload from Docker file with resource type (git rate limit)
 */

test.describe(
  'Create Application from Docker file',
  { tag: ['@dev-console', '@regression'] },
  () => {
    const ns = `aut-addflow-docker-${Date.now()}`;
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

    test('Dockerfile details after entering git repo url [A-05-TC01]', async () => {
      await test.step('Navigate to Import from Git', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Enter Dockerfile git URL', async () => {
        await gitPage.enterGitRepoURL(
          'https://github.com/rohitkrai03/flask-dockerfile-example',
        );
        await gitPage.waitForGitValidation();
      });

      await test.step('Verify auto-detected values', async () => {
        await expect(gitPage.getAppNameInput()).toHaveValue(
          'flask-dockerfile-example-app',
          { timeout: 15_000 },
        );
        await expect(gitPage.getNameInput()).toHaveValue('flask-dockerfile-example');
      });
    });

    test('cancel Dockerfile form redirects to Add page [A-05-TC03]', async () => {
      test.slow();

      await test.step('Navigate to Import from Git', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Enter URL and cancel', async () => {
        await gitPage.enterGitRepoURL(
          'https://github.com/rohitkrai03/flask-dockerfile-example',
        );
        await gitPage.waitForGitValidation();
        await gitPage.selectResourceType('Deployment');
        await gitPage.clickCancel();
      });

      await test.step('Verify redirect to Add page', async () => {
        await expect(addPage.getPageHeading()).toBeVisible();
      });
    });

    test('create workload from Dockerfile with exposed port [A-05-TC04]', async () => {
      test.slow();

      await test.step('Navigate to Import from Git', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Fill form with Dockerfile and target port', async () => {
        await gitPage.enterGitRepoURL(
          'https://github.com/rohitkrai03/flask-dockerfile-example',
        );
        await gitPage.waitForGitValidation();
        await gitPage.enterName('dockerfile-5000');
        await gitPage.selectResourceType('Deployment');
        await gitPage.clickCreate();
      });

      await test.step('Verify workload in topology', async () => {
        await topologyPage.waitForWorkload('dockerfile-5000');
      });
    });
  },
);
