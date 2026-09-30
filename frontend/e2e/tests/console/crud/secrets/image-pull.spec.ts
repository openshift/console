import { Base64 } from 'js-base64';

import { test, expect } from '../../../../fixtures';
import { DetailsPage } from '../../../../pages/details-page';
import { ModalPage } from '../../../../pages/modal-page';
import { SecretsPage } from '../../../../pages/secrets-page';

function encode(username: string, password: string): string {
  return Base64.encode(`${username}:${password}`);
}

test.describe('Image pull secrets', () => {
  let namespace: string;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-image-pull-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test('creates, edits, and deletes an image registry credentials pull secret', async ({
    page,
    k8sClient,
  }) => {
    const secretName = `img-creds-${Date.now()}`;
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const modalPage = new ModalPage(page);

    const address = 'https://index.openshift.io/v';
    const username = 'username';
    const password = 'password';
    const mail = 'test@secret.com';

    const credentialsToCheck = {
      '.dockerconfigjson': {
        auths: {
          [`${address}0`]: {
            username: `${username}0`,
            password: `${password}0`,
            auth: encode(`${username}0`, `${password}0`),
            email: `${mail}0`,
          },
          [`${address}1`]: {
            username: `${username}1`,
            password: `${password}1`,
            auth: encode(`${username}1`, `${password}1`),
            email: `${mail}1`,
          },
        },
      },
    };

    const addressUpdated = 'https://index.openshift.io/updated/v1';
    const usernameUpdated = `${username}Updated`;
    const passwordUpdated = `${password}Updated`;
    const mailUpdated = 'testUpdated@secret.com';

    const updatedCredentialsToCheck = {
      '.dockerconfigjson': {
        auths: {
          [addressUpdated]: {
            username: usernameUpdated,
            password: passwordUpdated,
            auth: encode(usernameUpdated, passwordUpdated),
            email: mailUpdated,
          },
        },
      },
    };

    await test.step('Create secret with two credential entries', async () => {
      await secretsPage.navigateToCreateImagePullSecret(namespace);
      await expect(secretsPage.getPageHeading()).toContainText('Create image pull secret');
      await secretsPage.enterSecretName(secretName);
      await secretsPage.clickAddCredentials();
      await secretsPage.fillCredentialEntry(
        0,
        `${address}0`,
        `${username}0`,
        `${password}0`,
        `${mail}0`,
      );
      await secretsPage.fillCredentialEntry(
        1,
        `${address}1`,
        `${username}1`,
        `${password}1`,
        `${mail}1`,
      );
      await secretsPage.save();
    });

    await test.step('Verify secret data', async () => {
      await secretsPage.navigateToSecretDetails(namespace, secretName);
      await detailsPage.waitForPageLoad();
      await secretsPage.checkSecretData(credentialsToCheck, true);
    });

    await test.step('Edit secret with whitespace in input values', async () => {
      await detailsPage.clickActionsMenuAction('Edit Secret');
      await expect(secretsPage.getPageHeading()).toContainText('Edit image pull secret');
      await expect(secretsPage.getCredentialForm()).toHaveCount(2);
      await secretsPage.clickRemoveFirstEntry();
      await secretsPage.getAddressInput().fill(`  ${addressUpdated}  `);
      await secretsPage.getUsernameInput().fill(`  ${usernameUpdated}  `);
      await secretsPage.getPasswordInput().fill(`  ${passwordUpdated}  `);
      await secretsPage.getEmailInput().fill(`  ${mailUpdated}  `);
      await secretsPage.save();
    });

    await test.step('Verify whitespace trimmed after edit', async () => {
      await secretsPage.navigateToSecretDetails(namespace, secretName);
      await detailsPage.waitForPageLoad();
      await secretsPage.checkSecretData(updatedCredentialsToCheck, true);
    });

    await test.step('Delete secret', async () => {
      await detailsPage.clickActionsMenuAction('Delete Secret');
      await modalPage.waitForOpen();
      await modalPage.submit();
      await modalPage.waitForClosed();
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });

  test('creates and deletes an upload configuration file image pull secret', async ({
    page,
    k8sClient,
  }) => {
    const secretName = `img-config-${Date.now()}`;
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const modalPage = new ModalPage(page);

    const configFile = {
      auths: {
        'https://index.openshift.io/v1': {
          username: 'username',
          password: 'password',
          auth: encode('username', 'password'),
          email: 'test@secret.com',
        },
      },
    };

    await test.step('Create secret with uploaded config file', async () => {
      await secretsPage.navigateToCreateImagePullSecret(namespace);
      await expect(secretsPage.getPageHeading()).toContainText('Create image pull secret');
      await secretsPage.enterSecretName(secretName);
      await secretsPage.selectAuthType('config-file');
      await secretsPage.getFileInputTextarea().fill(JSON.stringify(configFile));
      await expect(page.getByTestId('save-changes')).toBeEnabled({ timeout: 30_000 });
      await secretsPage.save();
    });

    await test.step('Verify secret data', async () => {
      await secretsPage.navigateToSecretDetails(namespace, secretName);
      await detailsPage.waitForPageLoad();
      await secretsPage.checkSecretData({ '.dockerconfigjson': configFile }, true);
    });

    await test.step('Delete secret', async () => {
      await detailsPage.clickActionsMenuAction('Delete Secret');
      await modalPage.waitForOpen();
      await modalPage.submit();
      await modalPage.waitForClosed();
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });

  test('passwords entered on the console are obfuscated', async ({ page }) => {
    const secretsPage = new SecretsPage(page);

    await secretsPage.navigateToCreateImagePullSecret(namespace);
    await expect(secretsPage.getPasswordInput()).toHaveAttribute('type', 'password');

    await secretsPage.navigateToCreateSourceSecret(namespace);
    await expect(secretsPage.getSecretPasswordInput()).toHaveAttribute('type', 'password');
  });
});
