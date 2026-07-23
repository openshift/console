import * as fs from 'fs';
import * as path from 'path';

import { test, expect } from '../../../../fixtures';
import { warmupSPA } from '../../../../pages/base-page';
import { SecretPage } from '../../../../pages/secret-page';

const fixturesDir = path.resolve(import.meta.dirname, '..', '..', '..', '..', 'fixtures', 'secrets');

test.describe('Key/value secrets', { tag: ['@admin', '@crud'] }, () => {
  test('creates a binary file secret', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-secret-kv-bin-${Date.now()}`;
    const secretName = `binary-secret`;
    const secretKey = 'secretkey';
    const modifiedKey = 'modifiedsecretkey';
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create binary file secret', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('generic');
      await expect(secretPage.getPageHeading()).toContainText('Create key/value secret');
      await secretPage.fillName(secretName);
      await secretPage.fillSecretKey(secretKey);
      await secretPage.uploadFile(path.join(fixturesDir, 'binarysecret.bin'));
      await expect(secretPage.getBinaryAlert()).toBeVisible();
      await secretPage.save();
    });

    await test.step('Verify binary secret via API', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      const secret = await k8sClient.getSecret(secretName, ns);
      const expectedBase64 = fs.readFileSync(path.join(fixturesDir, 'binarysecret.bin')).toString('base64');
      expect((secret as any).data[secretKey]).toBe(expectedBase64);
    });

    await test.step('Edit secret key and verify data preserved', async () => {
      await secretPage.editSecret();
      await expect(secretPage.getPageHeading()).toContainText('Edit key/value secret');
      await secretPage.getSecretKeyInput().clear();
      await secretPage.fillSecretKey(modifiedKey);
      await expect(secretPage.getBinaryAlert()).toBeVisible();
      await secretPage.save();
      await secretPage.detailsPageIsLoaded(secretName);
      const secret = await k8sClient.getSecret(secretName, ns);
      const expectedBase64 = fs.readFileSync(path.join(fixturesDir, 'binarysecret.bin')).toString('base64');
      expect((secret as any).data[modifiedKey]).toBe(expectedBase64);
    });
  });

  test('creates an ascii file secret', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-secret-kv-ascii-${Date.now()}`;
    const secretName = `ascii-secret`;
    const secretKey = 'secretkey';
    const secretPage = new SecretPage(page);
    const asciiContent = fs.readFileSync(path.join(fixturesDir, 'asciisecret.txt'), 'utf-8');

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create ascii file secret', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('generic');
      await secretPage.fillName(secretName);
      await secretPage.fillSecretKey(secretKey);
      await secretPage.uploadFile(path.join(fixturesDir, 'asciisecret.txt'));
      await expect(secretPage.getFileInputTextarea()).toContainText(asciiContent);
      await expect(secretPage.getBinaryAlert()).toBeHidden();
      await secretPage.save();
    });

    await test.step('Verify ascii secret via API', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      const secret = await k8sClient.getSecret(secretName, ns);
      const decoded = Buffer.from((secret as any).data[secretKey], 'base64').toString('utf-8');
      expect(decoded).toBe(asciiContent);
    });
  });

  test('creates a unicode file secret', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-secret-kv-unicode-${Date.now()}`;
    const secretName = `unicode-secret`;
    const secretKey = 'secretkey';
    const secretPage = new SecretPage(page);
    const unicodeContent = fs.readFileSync(path.join(fixturesDir, 'unicodesecret.utf8'), 'utf-8');

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create unicode file secret', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('generic');
      await secretPage.fillName(secretName);
      await secretPage.fillSecretKey(secretKey);
      await secretPage.uploadFile(path.join(fixturesDir, 'unicodesecret.utf8'));
      await expect(secretPage.getFileInputTextarea()).toContainText(unicodeContent);
      await expect(secretPage.getBinaryAlert()).toBeHidden();
      await secretPage.save();
    });

    await test.step('Verify unicode secret via API', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      const secret = await k8sClient.getSecret(secretName, ns);
      const decoded = Buffer.from((secret as any).data[secretKey], 'base64').toString('utf-8');
      expect(decoded).toBe(unicodeContent);
    });
  });

  test('edits a TLS secret', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-secret-kv-tls-${Date.now()}`;
    const secretName = `tls-secret`;
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace and TLS secret', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createSecret(ns, {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: secretName, namespace: ns },
        type: 'kubernetes.io/tls',
        data: {
          'tls.crt': 'QUFBCG==',
          'tls.key': 'QkJCCg==',
        },
      } as any);
    });

    await test.step('Edit TLS secret and add key', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets/${secretName}/edit`);
      await secretPage.addKeyValueEntry('keyfortest', 'valuefortest');
      await secretPage.save();
    });

    await test.step('Verify new key appears on details page', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.checkKeyValueExist('keyfortest', 'valuefortest');
      const secret = await k8sClient.getSecret(secretName, ns);
      expect((secret as any).data).toBeDefined();
    });
  });

  test('editing text field does not corrupt binary data (OCPBUGS-70273)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-secret-kv-mixed-${Date.now()}`;
    const secretName = 'mixed-secret';
    const textKey = 'textfield';
    const textValue = 'original-password';
    const updatedTextValue = 'updated-password';
    const binaryKey = 'binaryfield';
    const binaryBase64 = fs.readFileSync(path.join(fixturesDir, 'binarysecret.bin')).toString('base64');
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace and mixed secret', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
      await k8sClient.createSecret(ns, {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: { name: secretName, namespace: ns },
        data: {
          [textKey]: Buffer.from(textValue).toString('base64'),
          [binaryKey]: binaryBase64,
        },
      } as any);
    });

    await test.step('Edit only the text field', async () => {
      await warmupSPA(page);
      await page.goto(`/k8s/ns/${ns}/secrets/${secretName}`);
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.editSecret();
      await expect(secretPage.getPageHeading()).toContainText('Edit key/value secret');
      await expect(secretPage.getBinaryAlert()).toBeVisible();
      const textArea = secretPage.getFileInputTextarea().first();
      await textArea.clear();
      await textArea.fill(updatedTextValue);
      await secretPage.save();
    });

    await test.step('Verify text updated and binary preserved', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      await secretPage.revealValues();
      await expect(secretPage.getClipboards().first()).toContainText(updatedTextValue);
      const secret = await k8sClient.getSecret(secretName, ns);
      expect((secret as any).data[binaryKey]).toBe(binaryBase64);
    });
  });
});
