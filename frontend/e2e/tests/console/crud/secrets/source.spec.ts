import { test, expect } from '../../../../fixtures';
import { SecretPage } from '../../../../pages/secret-page';

test.describe('Source secrets', { tag: ['@admin', '@crud'] }, () => {
  test('creates, edits, and deletes a basic source secret', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-secret-src-basic-${Date.now()}`;
    const secretName = `basic-source-secret`;
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create basic source secret', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('source');
      await expect(page.getByTestId('page-heading')).toContainText('Create source secret');
      await secretPage.fillName(secretName);
      await secretPage.fillBasicAuth('username', 'password');
      await secretPage.save();
    });

    await test.step('Verify secret data', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.verifySecretData({
        password: 'password',
        username: 'username',
      });
    });

    await test.step('Edit secret', async () => {
      await secretPage.editSecret();
      await expect(page.getByTestId('page-heading')).toContainText('Edit source secret');
      await expect(page.getByTestId('secret-username')).toHaveValue('username');
      await expect(page.getByTestId('secret-password')).toHaveValue('password');
      await page.getByTestId('secret-username').clear();
      await page.getByTestId('secret-username').fill('usernameUpdated');
      await page.getByTestId('secret-password').clear();
      await page.getByTestId('secret-password').fill('passwordUpdated');
      await secretPage.save();
    });

    await test.step('Verify edit', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.verifySecretData({
        password: 'passwordUpdated',
        username: 'usernameUpdated',
      });
    });

    await test.step('Delete secret', async () => {
      await secretPage.deleteSecret(secretName);
    });
  });

  test('creates, edits, and deletes an SSH source secret', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-secret-src-ssh-${Date.now()}`;
    const secretName = `ssh-source-secret`;
    const sshKey = 'sshKey';
    const sshKeyUpdated = 'sshKeyUpdated';
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create SSH source secret', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('source');
      await expect(page.getByTestId('page-heading')).toContainText('Create source secret');
      await secretPage.fillName(secretName);
      await secretPage.selectAuthType('kubernetes.io/ssh-auth');
      await page.locator('[data-test-id="file-input-textarea"]').fill(sshKey);
      await secretPage.save();
    });

    await test.step('Verify secret data', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.verifySecretData({
        'ssh-privatekey': `${sshKey}\n`,
      });
    });

    await test.step('Edit secret', async () => {
      await secretPage.editSecret();
      await expect(page.getByTestId('page-heading')).toContainText('Edit source secret');
      const textarea = page.locator('[data-test-id="file-input-textarea"]');
      await expect(textarea).toContainText(sshKey);
      await textarea.clear();
      await textarea.fill(sshKeyUpdated);
      await secretPage.save();
    });

    await test.step('Verify edit', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.verifySecretData({
        'ssh-privatekey': `${sshKeyUpdated}\n`,
      });
    });

    await test.step('Delete secret', async () => {
      await secretPage.deleteSecret(secretName);
    });
  });
});
