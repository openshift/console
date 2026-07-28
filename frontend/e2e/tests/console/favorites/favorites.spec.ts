import { test, expect } from '../../../fixtures';

test.describe('Favorites', { tag: ['@admin'] }, () => {
  test('adds, displays, removes, and limits favorites', async ({ page, k8sClient }) => {
    const sidebar = page.locator('#page-sidebar');

    await test.step('Clear any stale favorites and lastNamespace from prior runs', async () => {
      try {
        await k8sClient.patchConfigMap(
          'user-settings-kubeadmin',
          'openshift-console-user-settings',
          { 'console.favorites': '[]', 'console.lastNamespace': '' },
        );
      } catch {
        // ConfigMap may not exist yet
      }
    });

    // Navigate directly to /dashboards — do NOT use warmupSPA (which navigates to "/",
    // poisoning sessionStorage with lastNamespace and causing SPA redirects).
    // Use expect.toPass to retry the navigation until the cleared favorites propagate.
    await expect(async () => {
      await page.goto('/dashboards', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await expect(page.getByTestId('page-heading').locator('h1')).toContainText('Overview', {
        timeout: 10_000,
      });
      const favButton = page.getByTestId('favorite-button');
      await expect(favButton).toBeVisible({ timeout: 10_000 });
      await expect(favButton).not.toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 });
    }).toPass({ timeout: 60_000, intervals: [2_000, 5_000, 10_000] });

    await test.step('Verify no favorites message when none are added', async () => {
      await sidebar.getByRole('button', { name: 'Favorites' }).click();
      await expect(page.getByTestId('no-favorites-message')).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Open Add to Favorites modal', async () => {
      await page.getByTestId('favorite-button').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Add to favorites', { timeout: 10_000 });
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
      await page.goto('/dashboards');
      await expect(page.getByTestId('page-heading').locator('h1')).toContainText('Overview', {
        timeout: 30_000,
      });
      const addFavBtn = page.getByTestId('favorite-button');
      await expect(addFavBtn).toBeVisible({ timeout: 30_000 });
      await expect(addFavBtn).not.toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });

      await expect(async () => {
        await addFavBtn.click();
        await expect(page.getByRole('dialog')).toContainText('Add to favorites', {
          timeout: 5_000,
        });
      }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 5_000] });

      await page.getByRole('button', { name: 'Save' }).click();

      await expect(sidebar).toContainText('Overview');

      await page.getByTestId('remove-favorite-button').click();
      await expect(page.getByTestId('no-favorites-message')).toBeVisible();
    });

    await test.step('Disable add to favorite button when limit reached', async () => {
      const pages = [
        '/dashboards',
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
        const btn = page.getByTestId('favorite-button').first();
        await expect(btn).toBeVisible({ timeout: 30_000 });
        await expect(btn).not.toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });

        // Wrap click-and-dialog in a retry loop — the button can render before
        // user preferences finish loading, so the first click may not open the
        // dialog if the component is still hydrating.
        await expect(async () => {
          await btn.click();
          await expect(page.getByRole('dialog')).toContainText('Add to favorites', {
            timeout: 5_000,
          });
        }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 5_000] });

        const nameInput = page.getByTestId('input-name');
        await nameInput.clear();
        await nameInput.fill(`test-favorite-${i}`);
        await nameInput.press('Enter');
        await expect(page.getByRole('dialog')).toBeHidden();
      }

      await page.goto('/k8s/all-namespaces/apps~v1~DaemonSet');
      await expect(page.getByTestId('favorite-button').first()).toBeDisabled();
    });

  });
});
