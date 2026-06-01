import * as fs from 'fs';
import * as path from 'path';

import { test, expect } from '../../../../fixtures';
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
      await expect(page.getByTestId('page-heading')).toContainText('Create key/value secret');
      await secretPage.fillName(secretName);
      await page.getByTestId('secret-key').fill(secretKey);
      await secretPage.uploadFile(path.join(fixturesDir, 'binarysecret.bin'));
      await expect(page.getByTestId('file-input-binary-alert')).toBeVisible();
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
      await expect(page.getByTestId('page-heading')).toContainText('Edit key/value secret');
      await page.getByTestId('secret-key').clear();
      await page.getByTestId('secret-key').fill(modifiedKey);
      await expect(page.getByTestId('file-input-binary-alert')).toBeVisible();
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
      await page.getByTestId('secret-key').fill(secretKey);
      await secretPage.uploadFile(path.join(fixturesDir, 'asciisecret.txt'));
      await expect(page.locator('[data-test-id="file-input-textarea"]')).toContainText(asciiContent);
      await expect(page.getByTestId('file-input-binary-alert')).toBeHidden();
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
      await page.getByTestId('secret-key').fill(secretKey);
      await secretPage.uploadFile(path.join(fixturesDir, 'unicodesecret.utf8'));
      await expect(page.locator('[data-test-id="file-input-textarea"]')).toContainText(unicodeContent);
      await expect(page.getByTestId('file-input-binary-alert')).toBeHidden();
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
});
