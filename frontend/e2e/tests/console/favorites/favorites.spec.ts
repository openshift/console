import { test, expect } from '../../../fixtures';
import { warmupSPA } from '../../../pages/base-page';

test.describe('Favorites', { tag: ['@admin'] }, () => {
  test('adds, displays, removes, and limits favorites', async ({ page }) => {
    const sidebar = page.locator('#page-sidebar');

    await warmupSPA(page);

    await test.step('Verify no favorites message when none are added', async () => {
      await sidebar.getByRole('button', { name: 'Favorites' }).click();
      await expect(page.getByTestId('no-favorites-message')).toBeVisible();
    });

    await test.step('Open Add to Favorites modal', async () => {
      await page.getByTestId('favorite-button').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Add to favorites');
    });

    await test.step('Save a favorite with custom name', async () => {
      const nameInput = page.getByTestId('input-name');
      await expect(nameInput).toHaveValue('Overview');
      await nameInput.clear();
      await nameInput.fill('test-favorite');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(sidebar).toContainText('test-favorite');
    });

    await test.step('Remove a favorite by clicking the favorite button again', async () => {
      await page.getByTestId('favorite-button').click();
      await expect(page.getByTestId('no-favorites-message')).toBeVisible();
    });

    await test.step('Remove a favorite from the left navigation menu', async () => {
      await page.goto('/');
      await page.getByTestId('favorite-button').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Add to favorites');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(sidebar).toContainText('Overview');

      await page.getByTestId('remove-favorite-button').click();
      await expect(page.getByTestId('no-favorites-message')).toBeVisible();
    });

    await test.step('Disable add to favorite button when limit reached', async () => {
      const pages = [
        '/',
        '/k8s/all-namespaces/core~v1~Pod',
        '/k8s/all-namespaces/apps~v1~Deployment',
        '/k8s/all-namespaces/core~v1~Secret',
        '/k8s/all-namespaces/core~v1~ConfigMap',
        '/k8s/cluster/core~v1~Node',
        '/k8s/all-namespaces/batch~v1~CronJob',
        '/k8s/all-namespaces/batch~v1~Job',
        '/k8s/all-namespaces/apps~v1~ReplicaSet',
        '/k8s/all-namespaces/core~v1~ReplicationController',
      ];

      for (let i = 0; i < pages.length; i++) {
        await page.goto(pages[i]);
        await page.getByTestId('favorite-button').first().click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toContainText('Add to favorites');
        const nameInput = page.getByTestId('input-name');
        await nameInput.clear();
        await nameInput.fill(`test-favorite-${i}`);
        await nameInput.press('Enter');
        await expect(dialog).toBeHidden();
      }

      await page.goto('/k8s/all-namespaces/apps~v1~DaemonSet');
      await expect(page.getByTestId('favorite-button').first()).toBeDisabled();
    });

  });
});
