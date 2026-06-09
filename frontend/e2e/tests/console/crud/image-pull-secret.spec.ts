import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { Navigation } from '../../../pages/navigation';

test.describe('Image pull secret', { tag: ['@admin'] }, () => {
  let namespace: string;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-ips-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test('create image pull secret with whitespace-trimmed input values', async ({ page }) => {
    const secretName = `test-image-pull-secret-${Date.now()}`;
    const rsAddress = 'docker.io';
    const username = 'testUser51';
    const password = 'test1234';
    const email = 'testEmail@email.com';

    const nav = new Navigation(page);
    const listPage = new ListPage(page);

    await test.step('Navigate to Secrets and open Create Image Pull Secret form', async () => {
      await nav.navigateToWorkloads('Secrets');
      await listPage.selectProject(namespace);
      await listPage.clickCreateDropdownItem('Image pull secret');

      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Create image pull secret',
      );
    });

    await test.step('Fill form with whitespace-padded values', async () => {
      await page.getByTestId('secret-name').fill(secretName);
      await page.getByTestId('image-secret-address').fill(`    ${rsAddress}    `);
      await page.getByTestId('image-secret-username').fill(`   ${username}   `);
      await page.getByTestId('image-secret-password').fill(`  ${password}  `);
      await page.getByTestId('image-secret-email').fill(` ${email} `);
      await page.getByTestId('image-secret-email').blur();
    });

    await test.step('Verify whitespace is trimmed from all fields', async () => {
      await expect(page.getByTestId('image-secret-address')).toHaveValue(rsAddress);
      await expect(page.getByTestId('image-secret-username')).toHaveValue(username);
      await expect(page.getByTestId('image-secret-password')).toHaveValue(password);
      await expect(page.getByTestId('image-secret-email')).toHaveValue(email);
    });

    await test.step('Save and verify secret is created', async () => {
      await page.getByTestId('save-changes').click();

      const details = new DetailsPage(page);
      await details.waitForPageLoad();
      await expect(details.getPageHeading()).toContainText(secretName);
    });
  });
});
