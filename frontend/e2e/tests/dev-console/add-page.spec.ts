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

test.describe('Add page on Developer Console', { tag: ['@dev-console', '@regression'] }, () => {
  const ns = `aut-add-page-${Date.now()}`;
  let addPage: AddPage;

  test.beforeEach(async ({ page, k8sClient, cleanup }) => {
    addPage = new AddPage(page);
    await k8sClient.createNamespace(ns);
    cleanup.trackNamespace(ns);
    await addPage.ensureDevPerspectiveAndNavigate(ns);
  });

  test('displays Getting started resources [A-11-TC01]', async () => {
    const gettingStarted = addPage.getGettingStartedResources();
    await expect(gettingStarted).toBeVisible({ timeout: 30_000 });
    await expect(addPage.getAddCardItem('Create Application using Samples')).toBeVisible();
    await expect(addPage.getAddCardItem('Build with guided documentation')).toBeVisible();
    await expect(addPage.getAddCardItem('Explore new developer features')).toBeVisible();
  });

  test('displays Add page cards and options [A-11-TC02]', async () => {
    await expect(addPage.getAddCardItem('Software Catalog')).toBeVisible();
    await expect(addPage.getAddCardItem('Git Repository')).toBeVisible();
    await expect(addPage.getAddCardItem('Container images')).toBeVisible();
    await expect(addPage.getAddCardItem('Samples')).toBeVisible();
    await expect(addPage.getAddCardItem('From Local Machine')).toBeVisible();
  });

  test('displays Software Catalog sub-options [A-11-TC03]', async () => {
    await expect(addPage.getAddCardItem('All services')).toBeVisible();
    await expect(addPage.getAddCardItem('Database')).toBeVisible();
    await expect(addPage.getAddCardItem('Operator Backed')).toBeVisible();
    await expect(addPage.getAddCardItem('Helm Chart')).toBeVisible();
  });

  test('displays Git Repository sub-options [A-11-TC04]', async () => {
    await expect(addPage.getAddCardItem('Import from Git')).toBeVisible();
  });

  test('displays From Local Machine sub-options [A-11-TC05]', async () => {
    await expect(addPage.getAddCardItem('Import YAML')).toBeVisible();
    await expect(addPage.getAddCardItem('Upload JAR file')).toBeVisible();
  });

  test('Details toggle on/off [A-11-TC09, A-11-TC10]', async () => {
    await test.step('Toggle details on', async () => {
      await addPage.clickDetailsToggle();
    });

    await test.step('Toggle details off and reset', async () => {
      await addPage.clickDetailsToggle();
      // Reset to default state
      await addPage.clickDetailsToggle();
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
      await addPage.ensureDevPerspectiveAndNavigate(ns);
    });

    test('hide and show Getting started resources [A-11-TC06, A-11-TC07]', async () => {
      await test.step('Hide Getting Started Resources', async () => {
        const gettingStarted = addPage.getGettingStartedResources();
        await expect(gettingStarted).toBeVisible({ timeout: 30_000 });
        await addPage.hideGettingStartedFromKebab();
        await expect(gettingStarted).toBeHidden();
      });

      await test.step('Show Getting Started Resources again', async () => {
        await addPage.clickShowGettingStartedResources();
        const gettingStarted = addPage.getGettingStartedResources();
        await expect(gettingStarted).toBeVisible();
      });
    });
  },
);
