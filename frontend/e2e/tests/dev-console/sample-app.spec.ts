import type KubernetesClient from '../../clients/kubernetes-client';
import type { CleanupFixture } from '../../fixtures';
import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { AddPage } from '../../pages/dev-console/add-page';

const NS_PREFIX = 'aut-addflow-samples';

async function createTestNamespace(
  k8sClient: KubernetesClient,
  cleanup: CleanupFixture,
  suffix: string,
): Promise<string> {
  const ns = `${NS_PREFIX}-${suffix}-${Date.now()}`;
  await k8sClient.createNamespace(ns);
  cleanup.trackNamespace(ns);
  return ns;
}

async function navigateToSamplesPage(addPage: AddPage, ns: string): Promise<void> {
  await addPage.switchPerspective('Developer');
  await addPage.navigateToAdd(ns);
  await addPage.clickViewAllSamples();
}

test.describe('Sample Application from Add page', { tag: ['@dev-console', '@getting-started'] }, () => {
  test(
    'GS-03-TC01: View all samples link navigates to Samples page',
    { tag: ['@regression'] },
    async ({ page, k8sClient, cleanup }) => {
      const ns = await createTestNamespace(k8sClient, cleanup, 'tc01');
      const addPage = new AddPage(page);
      await warmupSPA(page);

      await test.step('Navigate to Add page and verify samples link', async () => {
        await addPage.switchPerspective('Developer');
        await addPage.navigateToAdd(ns);
        await expect(addPage.getViewAllSamples()).toBeVisible({ timeout: 30_000 });
      });

      await test.step('Click View all samples and verify Samples page', async () => {
        await addPage.clickViewAllSamples();
        await expect(addPage.getPageHeading()).toContainText('Samples', { timeout: 30_000 });
      });

      await test.step('Verify sample cards are visible', async () => {
        await expect(addPage.getSampleCards().first()).toBeVisible({ timeout: 30_000 });
      });
    },
  );

  test(
    'GS-03-TC02: Review sample application form for Httpd',
    { tag: ['@regression'] },
    async ({ page, k8sClient, cleanup }) => {
      const ns = await createTestNamespace(k8sClient, cleanup, 'tc02');
      const addPage = new AddPage(page);
      await warmupSPA(page);

      await test.step('Navigate to Samples page', async () => {
        await navigateToSamplesPage(addPage, ns);
        await expect(addPage.getPageHeading()).toContainText('Samples', { timeout: 30_000 });
      });

      await test.step('Select Httpd sample', async () => {
        await addPage.clickSampleCard('Httpd');
        await expect(addPage.getPageHeading()).toContainText('Create Sample application', {
          timeout: 30_000,
        });
      });

      await test.step('Verify form has name field', async () => {
        await expect(addPage.getFormAppName()).toBeVisible();
      });

      await test.step('Verify builder image version dropdown', async () => {
        await expect(addPage.getBuilderImageVersionToggle()).toBeVisible();
      });

      await test.step('Verify git URL is present and disabled', async () => {
        const gitInput = addPage.getGitUrlInput();
        await expect(gitInput).toBeVisible();
        await expect(gitInput).toBeDisabled();
      });

      await test.step('Verify Create and Cancel buttons', async () => {
        await expect(addPage.getSubmitButton()).toBeVisible();
        await expect(addPage.getCancelButton()).toBeVisible();
      });
    },
  );

  test(
    'GS-03-TC03: Edit sample application form for Go',
    { tag: ['@regression'] },
    async ({ page, k8sClient, cleanup }) => {
      const ns = await createTestNamespace(k8sClient, cleanup, 'tc03');
      const addPage = new AddPage(page);

      await warmupSPA(page);

      await test.step('Navigate to Samples page and select Go', async () => {
        await navigateToSamplesPage(addPage, ns);
        await expect(addPage.getPageHeading()).toContainText('Samples', { timeout: 30_000 });
        await addPage.clickSampleCard('Go');
        await expect(addPage.getPageHeading()).toContainText('Create Sample application', {
          timeout: 30_000,
        });
      });

      await test.step('Verify name can be edited', async () => {
        const nameInput = addPage.getFormAppName();
        await expect(nameInput).toBeVisible();
        await nameInput.clear();
        await nameInput.fill('golang-sample-app1');
        await expect(nameInput).toHaveValue('golang-sample-app1');
      });

      await test.step('Verify builder image version can be changed', async () => {
        const versionToggle = addPage.getBuilderImageVersionToggle();
        await expect(versionToggle).toBeVisible();
        await versionToggle.click();
        const latestOption = addPage.getBuilderImageVersionItem('latest');
        await expect(latestOption).toBeVisible();
      });

      // Note: This test does not submit the form or verify the application appears in topology.
      // Full E2E flow verification is deferred to a future batch.
    },
  );

  // eslint-disable-next-line playwright/expect-expect
  test('GS-03-TC04: Submit sample application form — placeholder', async () => {
    test.skip(true, 'Deferred to a future batch');
  });

  // eslint-disable-next-line playwright/expect-expect
  test('GS-03-TC05: Verify application in topology — placeholder', async () => {
    test.skip(true, 'Deferred to a future batch');
  });
});
