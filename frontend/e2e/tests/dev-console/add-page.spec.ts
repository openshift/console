import type KubernetesClient from '../../clients/kubernetes-client';
import { test, expect } from '../../fixtures';
import { AddPage } from '../../pages/dev-console/add-page';

/**
 * Migrated from:
 *   frontend/packages/dev-console/integration-tests/features/addFlow/add-page.feature
 *
 * Skipped scenarios:
 *   - A-11-TC08 (@manual) - Close Show Getting Started Resources link
 *   - A-11-TC11 (@manual) - Getting Started Resources card when all Quick Starts completed
 */

async function ensureGettingStartedVisible(k8sClient: KubernetesClient): Promise<void> {
  await k8sClient.patchConfigMap(
    'user-settings-kubeadmin',
    'openshift-console-user-settings',
    { 'devconsole.addPage.gettingStarted': 'show' },
  );
}

test.describe('Add page on Developer Console', { tag: ['@dev-console', '@regression'] }, () => {
  const ns = `aut-add-page-${Date.now()}`;
  let addPage: AddPage;

  test.beforeEach(async ({ page, k8sClient, cleanup }) => {
    addPage = new AddPage(page);
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);
    await addPage.ensureDevPerspectiveAndNavigate(ns);
  });

  test('displays Getting started resources [A-11-TC01]', async ({ k8sClient }) => {
    await ensureGettingStartedVisible(k8sClient);
    await addPage.navigateToAdd(ns);
    const gettingStarted = addPage.getGettingStartedResources();
    await expect(gettingStarted).toBeVisible({ timeout: 30_000 });
    const gsSection = addPage.getGettingStartedResources();
    await expect(gsSection.getByTestId('card samples')).toBeVisible();
    await expect(gsSection.getByTestId('card quick-start')).toBeVisible();
    await expect(gsSection.getByTestId('card developer-features')).toBeVisible();
  });

  test('displays Add page cards and options [A-11-TC02]', async () => {
    await expect(addPage.getAddCardHeading('Software Catalog')).toBeVisible({ timeout: 30_000 });
    await expect(addPage.getAddCardHeading('Git Repository')).toBeVisible();
    await expect(addPage.getAddCardHeading('Container images')).toBeVisible();
    await expect(addPage.getAddCardHeading('Samples')).toBeVisible();
    await expect(addPage.getAddCardHeading('From Local Machine')).toBeVisible();
  });

  test('displays Software Catalog sub-options [A-11-TC03]', async () => {
    await expect(addPage.getCardItem('dev-catalog')).toBeVisible({ timeout: 30_000 });
    await expect(addPage.getCardItem('dev-catalog-databases')).toBeVisible();
    await expect(addPage.getCardItem('operator-backed')).toBeVisible();
  });

  test('displays Git Repository sub-options [A-11-TC04]', async () => {
    await expect(addPage.getCardItem('import-from-git')).toBeVisible({ timeout: 30_000 });
  });

  test('displays From Local Machine sub-options [A-11-TC05]', async () => {
    await expect(addPage.getCardItem('import-yaml')).toBeVisible({ timeout: 30_000 });
  });

  test('Details switch on/off [A-11-TC09, A-11-TC10]', async () => {
    const switchInput = addPage.getDetailsSwitch().locator('input');

    await test.step('Toggle details off', async () => {
      await addPage.clickDetailsSwitch();
      await expect(switchInput).not.toBeChecked();
    });

    await test.step('Toggle details on again', async () => {
      await addPage.clickDetailsSwitch();
      await expect(switchInput).toBeChecked();
    });
  });
});

test.describe(
  'Add page Getting Started Resources visibility',
  { tag: ['@dev-console', '@smoke'] },
  () => {
    const ns = `aut-add-getting-started-${Date.now()}`;
    let addPage: AddPage;

    test.beforeEach(async ({ page, k8sClient, cleanup }) => {
      addPage = new AddPage(page);
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await ensureGettingStartedVisible(k8sClient);
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('hide and show Getting started resources [A-11-TC06, A-11-TC07]', async () => {
      await test.step('Hide Getting Started Resources', async () => {
        const gettingStarted = addPage.getGettingStartedResources();
        await expect(gettingStarted).toBeVisible({ timeout: 30_000 });
        await addPage.hideGettingStarted();
        await expect(gettingStarted).toBeHidden();
      });

      await test.step('Show Getting Started Resources again', async () => {
        await addPage.page.reload({ waitUntil: 'domcontentloaded' });
        await addPage.clickShowGettingStartedResources();
        const gettingStarted = addPage.getGettingStartedResources();
        await expect(gettingStarted).toBeVisible({ timeout: 30_000 });
      });
    });
  },
);
