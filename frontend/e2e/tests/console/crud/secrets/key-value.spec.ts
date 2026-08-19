import * as fs from 'fs';
import * as path from 'path';

import { test, expect } from '../../../../fixtures';
import { warmupSPA } from '../../../../pages/base-page';
import { DetailsPage } from '../../../../pages/details-page';
import { SecretsPage } from '../../../../pages/secrets-page';

const BINARY_FILENAME = 'binarysecret.bin';
const ASCII_FILENAME = 'asciisecret.txt';
const UNICODE_FILENAME = 'unicodesecret.utf8';
const SECRET_KEY = 'secretkey';
const MODIFIED_SECRET_KEY = 'modifiedsecretkey';

function fixturePath(filename: string): string {
  return path.resolve(import.meta.dirname, '../../../../mocks/secrets', filename);
}

function readFixtureBase64(filename: string): string {
  return fs.readFileSync(fixturePath(filename)).toString('base64');
}

function readFixtureUtf8(filename: string): string {
  return fs.readFileSync(fixturePath(filename), 'utf-8');
}

test.describe('Create key/value secrets', () => {
  let namespace: string;
  const tlsSecretName = `kv-tls-secret-${Date.now()}`;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-kv-secrets-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);

    await k8sClient.createSecret(tlsSecretName, namespace, {
      'tls.crt': 'QUFBCQ==',
      'tls.key': 'QkJCCg==',
    });
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  test('creates and edits a key/value secret with a binary file', async ({
    page,
    k8sClient,
  }) => {
    const secretName = `kv-binary-${Date.now()}`;
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const expectedBase64 = readFixtureBase64(BINARY_FILENAME);

    await test.step('Create secret with binary file', async () => {
      await secretsPage.navigateToCreateGenericSecret(namespace);
      await expect(secretsPage.getPageHeading()).toContainText('Create key/value secret');
      await secretsPage.enterSecretName(secretName);
      await secretsPage.fillSecretKey(SECRET_KEY);
      await secretsPage.uploadFile(fixturePath(BINARY_FILENAME));
      await expect(secretsPage.getFileInputTextarea()).not.toBeAttached();
      await expect(secretsPage.getBinaryAlert()).toBeVisible();
      await secretsPage.save();
    });

    await test.step('Verify secret details page', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
    });

    await test.step('Verify binary data integrity via API', async () => {
      const secret = (await k8sClient.coreV1Api.readNamespacedSecret({
        name: secretName,
        namespace,
      })) as { data?: Record<string, string> };
      expect(secret.data?.[SECRET_KEY]).toBe(expectedBase64);
    });

    await test.step('Edit secret key', async () => {
      await detailsPage.clickActionsMenuAction('Edit Secret');
      await expect(secretsPage.getPageHeading()).toContainText('Edit key/value secret');
      await secretsPage.fillSecretKey(MODIFIED_SECRET_KEY);
      await expect(secretsPage.getBinaryAlert()).toBeVisible();
      await secretsPage.save();
    });

    await test.step('Verify edited secret', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
      const secret = (await k8sClient.coreV1Api.readNamespacedSecret({
        name: secretName,
        namespace,
      })) as { data?: Record<string, string> };
      expect(secret.data?.[MODIFIED_SECRET_KEY]).toBe(expectedBase64);
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });

  test('creates a key/value secret with an ascii file', async ({ page, k8sClient }) => {
    const secretName = `kv-ascii-${Date.now()}`;
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const asciiContent = readFixtureUtf8(ASCII_FILENAME);

    await test.step('Create secret with ascii file', async () => {
      await secretsPage.navigateToCreateGenericSecret(namespace);
      await secretsPage.enterSecretName(secretName);
      await secretsPage.fillSecretKey(SECRET_KEY);
      await secretsPage.uploadFile(fixturePath(ASCII_FILENAME));
      await expect(secretsPage.getFileInputTextarea()).toContainText(asciiContent);
      await expect(secretsPage.getBinaryAlert()).not.toBeAttached();
      await secretsPage.save();
    });

    await test.step('Verify secret details page', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
    });

    await test.step('Verify ascii data integrity via API', async () => {
      const secret = (await k8sClient.coreV1Api.readNamespacedSecret({
        name: secretName,
        namespace,
      })) as { data?: Record<string, string> };
      const decoded = Buffer.from(secret.data?.[SECRET_KEY] ?? '', 'base64').toString('utf-8');
      expect(decoded).toBe(asciiContent);
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });

  test('creates a key/value secret with a unicode file', async ({ page, k8sClient }) => {
    const secretName = `kv-unicode-${Date.now()}`;
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);
    const unicodeContent = readFixtureUtf8(UNICODE_FILENAME);

    await test.step('Create secret with unicode file', async () => {
      await secretsPage.navigateToCreateGenericSecret(namespace);
      await secretsPage.enterSecretName(secretName);
      await secretsPage.fillSecretKey(SECRET_KEY);
      await secretsPage.uploadFile(fixturePath(UNICODE_FILENAME));
      await expect(secretsPage.getFileInputTextarea()).toContainText(unicodeContent);
      await expect(secretsPage.getBinaryAlert()).not.toBeAttached();
      await secretsPage.save();
    });

    await test.step('Verify secret details page', async () => {
      await detailsPage.waitForPageLoad();
      await expect(detailsPage.title).toContainText(secretName);
    });

    await test.step('Verify unicode data integrity via API', async () => {
      const secret = (await k8sClient.coreV1Api.readNamespacedSecret({
        name: secretName,
        namespace,
      })) as { data?: Record<string, string> };
      const decoded = Buffer.from(secret.data?.[SECRET_KEY] ?? '', 'base64').toString('utf-8');
      expect(decoded).toBe(unicodeContent);
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });

  test('edits a tls secret to add a key/value pair', async ({ page }) => {
    const secretsPage = new SecretsPage(page);

    await secretsPage.navigateToEditSecret(namespace, tlsSecretName);
    await secretsPage.addKeyValue('keyfortest', 'valuefortest');
    await secretsPage.save();

    const detailsPage = new DetailsPage(page);
    await detailsPage.waitForPageLoad();
    await expect(detailsPage.title).toContainText(tlsSecretName);
    await secretsPage.clickRevealValues();
    await expect(secretsPage.getSecretDataTerm().first()).toHaveText('keyfortest');
    await expect(secretsPage.getCopyToClipboard().first()).toContainText('valuefortest');
  });

  test('editing text field does not corrupt binary data (OCPBUGS-70273)', async ({
    page,
    k8sClient,
  }) => {
    const secretName = `kv-mixed-${Date.now()}`;
    const textKey = 'textfield';
    const textValue = 'original-password';
    const updatedTextValue = 'updated-password';
    const binaryKey = 'binaryfield';
    const secretsPage = new SecretsPage(page);
    const detailsPage = new DetailsPage(page);

    const binaryBase64 = readFixtureBase64(BINARY_FILENAME);
    const textBase64 = Buffer.from(textValue).toString('base64');

    await test.step('Create mixed secret via API', async () => {
      await k8sClient.createSecret(secretName, namespace, {
        [textKey]: textBase64,
        [binaryKey]: binaryBase64,
      });
    });

    await test.step('Edit only the text field via UI', async () => {
      await warmupSPA(page);
      await secretsPage.navigateToSecretDetails(namespace, secretName);
      await detailsPage.waitForPageLoad();
      await detailsPage.clickActionsMenuAction('Edit Secret');
      await secretsPage.getFileInputTextarea().first().fill(updatedTextValue);
      await expect(secretsPage.getBinaryAlert()).toBeVisible();
      await secretsPage.save();
    });

    await test.step('Verify text field was updated', async () => {
      await detailsPage.waitForPageLoad();
      await secretsPage.clickRevealValues();
      await expect(secretsPage.getCopyToClipboard()).toContainText([updatedTextValue]);
    });

    await test.step('Verify binary data was NOT corrupted', async () => {
      const secret = (await k8sClient.coreV1Api.readNamespacedSecret({
        name: secretName,
        namespace,
      })) as { data?: Record<string, string> };
      expect(secret.data?.[binaryKey]).toBe(binaryBase64);
    });

    await k8sClient.deleteSecret(secretName, namespace);
  });
});
