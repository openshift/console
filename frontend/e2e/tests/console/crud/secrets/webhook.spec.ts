import { test, expect } from '../../../../fixtures';
import { SecretPage } from '../../../../pages/secret-page';

test.describe('Webhook secret', { tag: ['@admin', '@crud'] }, () => {
  test('creates, regenerates, and deletes a webhook secret', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-secret-webhook-${Date.now()}`;
    const secretName = `webhook-secret`;
    const webhookKey = 'webhookValue';
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create webhook secret', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('webhook');
      await expect(page.getByTestId('page-heading')).toContainText('Create webhook secret');
      await secretPage.fillName(secretName);
      await page.getByTestId('secret-key').fill(webhookKey);
      await secretPage.save();
    });

    await test.step('Verify webhook secret', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.verifySecretData({
        WebHookSecretKey: webhookKey,
      });
    });

    await test.step('Edit and regenerate key', async () => {
      await secretPage.editSecret();
      await expect(page.getByTestId('page-heading')).toContainText('Edit webhook secret');
      await secretPage.generateWebhookKey();
      await secretPage.save();
    });

    await test.step('Verify key changed', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.revealValues();
      await expect(page.getByTestId('copy-to-clipboard').first()).not.toHaveText(webhookKey);
    });

    await test.step('Delete secret', async () => {
      await secretPage.deleteSecret(secretName);
    });
  });
});
