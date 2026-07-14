import { test, expect } from '../../fixtures';
import {
  AddPage,
  ImportFromGitPage,
  TopologyPage,
} from '../../pages/dev-console/add-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/create-from-git.feature
 *
 * Skipped scenarios (all @manual or @broken-test):
 *   - A-06-TC01 (@manual) - Add new git workload with new application (git rate limit)
 *   - A-06-TC12 (@manual) - Builder image detected for git url (git rate limit)
 *   - A-06-TC13 (@manual) - Dotnet Builder image detection (git rate limit)
 *   - A-06-TC14 (@manual) - "Unable to detect the builder image" warning
 *   - A-06-TC09 (@broken-test) - Scaling (OCPBUGS-30205)
 *   - A-06-TC15 (@broken-test) - Custom build environments for nodejs
 *   - A-06-TC16 (@broken-test) - Update custom build environment
 *   - A-06-TC17 (@broken-test) - Secure Route option
 */

test.describe(
  'Create Application from git form',
  { tag: ['@dev-console', '@regression'] },
  () => {
    const ns = `aut-addflow-git-${Date.now()}`;
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

    test('cancel git workload creation [A-06-TC03]', async () => {
      await test.step('Navigate to Import from Git', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Enter git URL and cancel', async () => {
        await gitPage.enterGitRepoURL('https://github.com/sclorg/dancer-ex.git');
        await gitPage.clickCancel();
      });

      await test.step('Verify redirect to Add page', async () => {
        await expect(addPage.getPageHeading()).toBeVisible();
      });
    });

    test('create workload without application route [A-06-TC04]', async () => {
      test.slow();

      await test.step('Navigate to Import from Git', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Fill form without route', async () => {
        await gitPage.enterGitRepoURL('https://github.com/sclorg/dancer-ex.git');
        await gitPage.waitForGitValidation();
        await gitPage.enterApplicationName('app-no-route');
        await gitPage.enterName('name-no-route');
        await gitPage.uncheckCreateRoute();
        await gitPage.clickCreate();
      });

      await test.step('Verify workload in topology', async () => {
        await topologyPage.waitForWorkload('name-no-route');
        await topologyPage.clickWorkload('name-no-route');
        await expect(topologyPage.getSidebarTitle()).toContainText('name-no-route');
      });
    });

    test('disable devfile import strategy for non-standard git type [A-06-TC18]', async () => {
      await test.step('Navigate to Import from Git', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Enter non-standard git URL', async () => {
        await gitPage.enterGitRepoURL('https://mysupersecretgit.example.com/org/repo');
      });

      await test.step('Verify devfile strategy is disabled', async () => {
        await expect(gitPage.getDevfileStrategyDisabled()).toBeVisible({ timeout: 15_000 });
      });
    });

    test('devfile not detected warning [A-06-TC19]', async () => {
      await test.step('Navigate to Import from Git', async () => {
        await addPage.clickImportFromGit();
      });

      await test.step('Enter devfile URL and invalid path', async () => {
        await gitPage.enterGitRepoURL('https://github.com/nodeshift-starters/devfile-sample');
        await gitPage.waitForGitValidation();
        await gitPage.clickEditImportStrategy();
        await gitPage.enterDevfilePath('devfile1');
      });

      await test.step('Verify devfile not detected message', async () => {
        await expect(gitPage.getDevfileNotDetectedMessage()).toBeVisible({ timeout: 15_000 });
      });
    });
  },
);
