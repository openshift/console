import { test, expect } from '../../../../fixtures';
import { DetailsPage } from '../../../../pages/details-page';
import { ModalPage } from '../../../../pages/modal-page';
import { SecretsPage } from '../../../../pages/secrets-page';

test.describe('Source secrets', () => {
  let namespace: string;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-source-secrets-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test('creates, edits, and deletes a basic source secret', async ({ page, k8sClient }) => {
    const secretName = `basic-src-${Date.now()}`;
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const modalPage = new ModalPage(page);

    const username = 'username';
    const password = 'password';
    const usernameUpdated = 'usernameUpdated';
    const passwordUpdated = 'passwordUpdated';

    await test.step('Create basic source secret', async () => {
      await secretsPage.navigateToCreateSourceSecret(namespace);
      await expect(secretsPage.getPageHeading()).toContainText('Create source secret');
      await secretsPage.enterSecretName(secretName);
      await page.getByTestId('secret-username').fill(username);
      await page.getByTestId('secret-password').fill(password);
      await secretsPage.save();
    });

    await test.step('Verify secret data', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
      await secretsPage.checkSecretData({ password, username });
    });

    await test.step('Edit secret', async () => {
      await detailsPage.clickActionsMenuAction('Edit Secret');
      await expect(secretsPage.getPageHeading()).toContainText('Edit source secret');
      await expect(page.getByTestId('secret-username')).toHaveValue(username);
      await expect(page.getByTestId('secret-password')).toHaveValue(password);
      await page.getByTestId('secret-username').fill(usernameUpdated);
      await page.getByTestId('secret-password').fill(passwordUpdated);
      await secretsPage.save();
    });

    await test.step('Verify edited secret data', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
      await secretsPage.checkSecretData({
        password: passwordUpdated,
        username: usernameUpdated,
      });
    });

    await test.step('Delete secret', async () => {
      await detailsPage.clickActionsMenuAction('Delete Secret');
      await modalPage.waitForOpen();
      await modalPage.submit();
      await modalPage.waitForClosed();
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });

  test('creates, edits, and deletes a SSH source secret', async ({ page, k8sClient }) => {
    const secretName = `ssh-src-${Date.now()}`;
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const modalPage = new ModalPage(page);

    const sshKey = 'sshKey';
    const sshKeyUpdated = 'sshKeyUpdated';

    await test.step('Create SSH source secret', async () => {
      await secretsPage.navigateToCreateSourceSecret(namespace);
      await expect(secretsPage.getPageHeading()).toContainText('Create source secret');
      await secretsPage.enterSecretName(secretName);
      await secretsPage.selectAuthType('ssh-auth');
      await secretsPage.getFileInputTextarea().fill(sshKey);
      await secretsPage.save();
    });

    await test.step('Verify secret data', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
      await secretsPage.checkSecretData({ 'ssh-privatekey': `${sshKey}\n` });
    });

    await test.step('Edit secret', async () => {
      await detailsPage.clickActionsMenuAction('Edit Secret');
      await expect(secretsPage.getPageHeading()).toContainText('Edit source secret');
      await expect(secretsPage.getFileInputTextarea()).toHaveValue(`${sshKey}\n`);
      await secretsPage.getFileInputTextarea().fill(sshKeyUpdated);
      await secretsPage.save();
    });

    await test.step('Verify edited secret data', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
      await secretsPage.checkSecretData({ 'ssh-privatekey': `${sshKeyUpdated}\n` });
    });

    await test.step('Delete secret', async () => {
      await detailsPage.clickActionsMenuAction('Delete Secret');
      await modalPage.waitForOpen();
      await modalPage.submit();
      await modalPage.waitForClosed();
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });
});
