/* eslint-disable playwright/expect-expect */
import { test } from '../../../fixtures';
import { OAuthPage } from '../../../pages/oauth-page';
import type KubernetesClient from '../../../clients/kubernetes-client';

// Skipped due to flakes: OCPBUGS-88451
// eslint-disable-next-line playwright/no-skipped-test
test.describe.skip('OAuth', { tag: ['@admin'] }, () => {
  let client: KubernetesClient;
  let originalOAuthConfig: any;
  const testPrefix = `e2e-${Date.now()}`;
  const createdIDPs: string[] = [];

  test.beforeAll(async ({ k8sClient }) => {
    client = k8sClient;

    // Save original OAuth configuration
    const response = await client.customObjectsApi.getClusterCustomObject({
      group: 'config.openshift.io',
      version: 'v1',
      plural: 'oauths',
      name: 'cluster',
    });
    originalOAuthConfig = response.body;
  });

  test.afterEach(async ({ page }) => {
    // Clean up any IDPs created in this test that weren't removed
    if (createdIDPs.length > 0) {
      const oauth = new OAuthPage(page);
      await oauth.navigateToOAuthSettings();
      for (const idpName of createdIDPs) {
        try {
          await oauth.removeIDP(idpName);
        } catch {
          // IDP may already be removed, continue
        }
      }
      createdIDPs.length = 0; // Clear the array
    }
  });

  test.afterAll(async () => {
    if (!originalOAuthConfig || !client) {
      return;
    }

    // Restore original identity providers
    const idps = originalOAuthConfig?.spec?.identityProviders ?? [];
    try {
      await client.customObjectsApi.patchClusterCustomObject({
        group: 'config.openshift.io',
        version: 'v1',
        plural: 'oauths',
        name: 'cluster',
        body: [
          {
            op: 'replace',
            path: '/spec/identityProviders',
            value: idps,
          },
        ],
      });
    } catch (err) {
      console.error('Failed to restore OAuth config:', err);
    }
  });

  test('creates a Basic Authentication IDP and shows it on the OAuth settings page', async ({
    page,
  }) => {
    const oauth = new OAuthPage(page);
    const idpName = `basic-auth-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and start IDP setup', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'basicauth');
    });

    await test.step('Fill Basic Authentication form', async () => {
      await page.locator('#url').fill('https://example.com');
    });

    await test.step('Save and verify IDP', async () => {
      await oauth.saveAndVerifyIDP(idpName, 'BasicAuth');
    });

    await test.step('Clean up: remove IDP', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop(); // Remove from tracking since we successfully deleted it
    });
  });

  test('creates a GitHub IDP and displays it on the OAuth settings page', async ({ page }) => {
    const oauth = new OAuthPage(page);
    const idpName = `github-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and start IDP setup', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'github');
    });

    await test.step('Fill GitHub form', async () => {
      await page.locator('#client-id').fill('my-client-id');
      await page.locator('#client-secret').fill('my-client-secret');
      await page.getByTestId('list-input-Organization').fill('my-organization');
    });

    await test.step('Save and verify IDP', async () => {
      await oauth.saveAndVerifyIDP(idpName, 'GitHub');
    });

    await test.step('Clean up: remove IDP', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop();
    });
  });

  test('creates a GitLab IDP and displays on the OAuth settings page', async ({ page }) => {
    const oauth = new OAuthPage(page);
    const idpName = `gitlab-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and start IDP setup', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'gitlab');
    });

    await test.step('Fill GitLab form', async () => {
      await page.locator('#url').fill('https://example.com');
      await page.locator('#client-id').fill('my-client-id');
      await page.locator('#client-secret').fill('my-client-secret');
    });

    await test.step('Save and verify IDP', async () => {
      await oauth.saveAndVerifyIDP(idpName, 'GitLab');
    });

    await test.step('Clean up: remove IDP', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop();
    });
  });

  test('creates a Google IDP and displays it on the OAuth settings page', async ({ page }) => {
    const oauth = new OAuthPage(page);
    const idpName = `google-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and start IDP setup', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'google');
    });

    await test.step('Fill Google form', async () => {
      await page.locator('#client-id').fill('my-client-id');
      await page.locator('#client-secret').fill('my-client-secret');
      await page.locator('#hosted-domain').fill('example.com');
    });

    await test.step('Save and verify IDP', async () => {
      await oauth.saveAndVerifyIDP(idpName, 'Google');
    });

    await test.step('Clean up: remove IDP', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop();
    });
  });

  test('creates a Keystone IDP and displays it on the OAuth settings page', async ({ page }) => {
    const oauth = new OAuthPage(page);
    const idpName = `keystone-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and start IDP setup', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'keystone');
    });

    await test.step('Fill Keystone form', async () => {
      await page.locator('#domain-name').fill('example.com');
      await page.locator('#url').fill('https://example.com');
    });

    await test.step('Save and verify IDP', async () => {
      await oauth.saveAndVerifyIDP(idpName, 'Keystone');
    });

    await test.step('Clean up: remove IDP', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop();
    });
  });

  test('creates a LDAP IDP and displays it on the OAuth settings page', async ({ page }) => {
    const oauth = new OAuthPage(page);
    const idpName = `ldap-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and start IDP setup', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'ldap');
    });

    await test.step('Fill LDAP form', async () => {
      await page.locator('#url').fill('ldap://ldap.example.com/o=Acme?cn?sub?(enabled=true)');
    });

    await test.step('Save and verify IDP', async () => {
      await oauth.saveAndVerifyIDP(idpName, 'LDAP');
    });

    await test.step('Clean up: remove IDP', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop();
    });
  });

  test('creates a OpenID IDP and displays it on the OAuth settings page', async ({ page }) => {
    const oauth = new OAuthPage(page);
    const idpName = `oidc-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and start IDP setup', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'oidconnect');
    });

    await test.step('Fill OpenID form', async () => {
      await page.locator('#client-id').fill('my-client-id');
      await page.locator('#client-secret').fill('my-client-secret');
      await page.locator('#issuer').fill('https://example.com');
    });

    await test.step('Save and verify IDP', async () => {
      await oauth.saveAndVerifyIDP(idpName, 'OpenID');
    });

    await test.step('Clean up: remove IDP', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop();
    });
  });

  test('creates and removes a Basic Authentication IDP', async ({ page }) => {
    const oauth = new OAuthPage(page);
    const idpName = `basic-auth-delete-${testPrefix}`;
    createdIDPs.push(idpName);

    await test.step('Navigate to OAuth settings and create IDP', async () => {
      await oauth.navigateToOAuthSettings();
      await oauth.startIDPSetup(idpName, 'basicauth');
      await page.locator('#url').fill('https://example.com');
      await oauth.saveAndVerifyIDP(idpName, 'BasicAuth');
    });

    await test.step('Remove IDP using kebab menu', async () => {
      await oauth.removeIDP(idpName);
      createdIDPs.pop();
    });

    await test.step('Verify IDP was removed', async () => {
      await oauth.verifyIDPNotExists(idpName);
    });
  });
});
