import { test, expect } from '../../../../fixtures';
import { DetailsPage } from '../../../../pages/details-page';
import { ModalPage } from '../../../../pages/modal-page';
import { SecretsPage } from '../../../../pages/secrets-page';

test.describe('Webhook secret', () => {
  let namespace: string;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-webhook-secret-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test('creates, edits, and deletes a webhook secret', async ({ page, k8sClient }) => {
    const secretName = `webhook-${Date.now()}`;
    const webhookSecretKey = 'webhookValue';
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const modalPage = new ModalPage(page);

    await test.step('Create webhook secret', async () => {
      await secretsPage.navigateToCreateWebhookSecret(namespace);
      await expect(secretsPage.getPageHeading()).toContainText('Create webhook secret');
      await secretsPage.enterSecretName(secretName);
      await secretsPage.fillSecretKey(webhookSecretKey);
      await secretsPage.save();
    });

    await test.step('Verify secret data', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
      await secretsPage.checkSecretData({ WebHookSecretKey: webhookSecretKey });
    });

    await test.step('Edit secret with generated value', async () => {
      await detailsPage.clickActionsMenuAction('Edit Secret');
      await expect(secretsPage.getPageHeading()).toContainText('Edit webhook secret');
      await expect(page.getByTestId('webhook-generate-button')).toBeVisible();
      await page.getByTestId('webhook-generate-button').click();
      await secretsPage.save();
    });

    await test.step('Verify generated value is different', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
      await secretsPage.clickRevealValues();
      const generatedValue = secretsPage.getCopyToClipboard().first();
      await expect(generatedValue).toHaveText(/\S+/);
      await expect(generatedValue).not.toHaveText(webhookSecretKey);
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
