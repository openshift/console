import { test, expect } from '../../../../fixtures';
import { SecretPage } from '../../../../pages/secret-page';

test.describe('Image pull secrets', { tag: ['@admin', '@crud'] }, () => {
  test('creates and edits registry credentials', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-secret-img-cred-${Date.now()}`;
    const secretName = `registry-cred-secret`;
    const secretPage = new SecretPage(page);
    const address = 'https://index.openshift.io/v';
    const addressUpdated = 'https://index.openshift.io/updated/v1';

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create image secret with two credential entries', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('image');
      await expect(secretPage.getPageHeading()).toContainText('Create image pull secret');
      await secretPage.fillName(secretName);
      await secretPage.addCredentialEntry();

      const count = await secretPage.getImagePullForms().count();
      for (let i = 0; i < count; i++) {
        await secretPage.fillImagePullCredential(i, {
          address: `${address}${i}`,
          username: `username${i}`,
          password: `password${i}`,
          email: `test@secret.com${i}`,
        });
      }
      await secretPage.save();
    });

    await test.step('Verify credentials via API', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      const secret = await k8sClient.getSecret(secretName, ns);
      const dockerConfig = JSON.parse(
        Buffer.from((secret as any).data['.dockerconfigjson'], 'base64').toString('utf-8'),
      );
      expect(dockerConfig.auths[`${address}0`].username).toBe('username0');
      expect(dockerConfig.auths[`${address}0`].password).toBe('password0');
      expect(dockerConfig.auths[`${address}0`].auth).toBe(SecretPage.encode('username0', 'password0'));
      expect(dockerConfig.auths[`${address}1`].username).toBe('username1');
      expect(dockerConfig.auths[`${address}1`].auth).toBe(SecretPage.encode('username1', 'password1'));
    });

    await test.step('Edit secret: remove entry, update with whitespace', async () => {
      await secretPage.editSecret();
      await expect(secretPage.getPageHeading()).toContainText('Edit image pull secret');
      await expect(secretPage.getImagePullForms()).toHaveCount(2);
      await secretPage.removeEntry(0);
      await secretPage.fillImagePullCredential(0, {
        address: `  ${addressUpdated}  `,
        username: '  usernameUpdated  ',
        password: '  passwordUpdated  ',
        email: '  testUpdated@secret.com  ',
      });
      await secretPage.save();
    });

    await test.step('Verify whitespace trimmed in API', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      const secret = await k8sClient.getSecret(secretName, ns);
      const dockerConfig = JSON.parse(
        Buffer.from((secret as any).data['.dockerconfigjson'], 'base64').toString('utf-8'),
      );
      expect(dockerConfig.auths[addressUpdated].username).toBe('usernameUpdated');
      expect(dockerConfig.auths[addressUpdated].password).toBe('passwordUpdated');
      expect(dockerConfig.auths[addressUpdated].email).toBe('testUpdated@secret.com');
      expect(dockerConfig.auths[addressUpdated].auth).toBe(
        SecretPage.encode('usernameUpdated', 'passwordUpdated'),
      );
    });
  });

  test('creates an upload config file image pull secret', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const ns = `test-secret-img-cfg-${Date.now()}`;
    const secretName = `config-file-secret`;
    const secretPage = new SecretPage(page);
    const configFile = {
      auths: {
        'https://index.openshift.io/v1': {
          username: 'username',
          password: 'password',
          auth: SecretPage.encode('username', 'password'),
          email: 'test@secret.com',
        },
      },
    };

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Create config file secret', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('image');
      await expect(secretPage.getPageHeading()).toContainText('Create image pull secret');
      await secretPage.fillName(secretName);
      await secretPage.selectAuthType('config-file');

      await secretPage.fillDockerConfig(JSON.stringify(configFile));
      await secretPage.save();
    });

    await test.step('Verify config file secret via API', async () => {
      await secretPage.detailsPageIsLoaded(secretName);
      const secret = await k8sClient.getSecret(secretName, ns);
      const dockerConfig = JSON.parse(
        Buffer.from((secret as any).data['.dockerconfigjson'], 'base64').toString('utf-8'),
      );
      expect(dockerConfig).toEqual(configFile);
    });
  });

  test('obfuscates password fields', async ({ page, k8sClient, cleanup }) => {
    const ns = `test-secret-img-pw-${Date.now()}`;
    const secretPage = new SecretPage(page);

    await test.step('Set up namespace', async () => {
      await k8sClient.createNamespace(ns);
      cleanup.trackNamespace(ns);
    });

    await test.step('Verify image pull password is obfuscated', async () => {
      await page.goto(`/k8s/ns/${ns}/secrets`);
      await secretPage.clickCreateSecretDropdownButton('image');
      await expect(
        secretPage.getImagePasswordInput(),
      ).toHaveAttribute('type', 'password');
      await secretPage.cancel();
    });

    await test.step('Verify source secret password is obfuscated', async () => {
      await secretPage.clickCreateSecretDropdownButton('source');
      await expect(
        secretPage.getPasswordInput(),
      ).toHaveAttribute('type', 'password');
    });
  });
});
