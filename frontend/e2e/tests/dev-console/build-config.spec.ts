import { test, expect } from '../../fixtures';
import { warmupSPA } from '../../pages/base-page';
import { BuildConfigPage } from '../../pages/dev-console/build-config-page';

const BUILDCONFIG_NAME = 'test-bc';

function createBuildConfigBody(namespace: string, name: string): Record<string, unknown> {
  return {
    apiVersion: 'build.openshift.io/v1',
    kind: 'BuildConfig',
    metadata: {
      name,
      namespace,
    },
    spec: {
      source: {
        type: 'Git',
        git: {
          uri: 'https://github.com/sclorg/nodejs-ex.git',
        },
      },
      strategy: {
        type: 'Source',
        sourceStrategy: {
          from: {
            kind: 'ImageStreamTag',
            namespace: 'openshift',
            name: 'nodejs:latest',
          },
        },
      },
      output: {
        to: {
          kind: 'ImageStreamTag',
          name: `${name}:latest`,
        },
      },
    },
  };
}

test.describe('Edit Build Config', { tag: ['@dev-console'] }, () => {
  let buildConfigPage: BuildConfigPage;

  test.beforeEach(async ({ page }) => {
    await warmupSPA(page);
    buildConfigPage = new BuildConfigPage(page);
  });

  test(
    'EBC-01-TC01: Edit Build Config page shows Name, Git URL, Image Configuration, and Environment Variables',
    { tag: ['@smoke'] },
    async ({ page, k8sClient, cleanup }) => {
      const ns = `aut-build-config-${Date.now()}`;

      await test.step('Create namespace and BuildConfig', async () => {
        await k8sClient.createNamespace(ns);
        await k8sClient.waitForNamespaceReady(ns);
        cleanup.trackNamespace(ns);
        await k8sClient.createCustomResource(
          'build.openshift.io',
          'v1',
          ns,
          'buildconfigs',
          createBuildConfigBody(ns, BUILDCONFIG_NAME),
        );
      });

      await test.step('Navigate to Edit Build Config form', async () => {
        await buildConfigPage.navigateToEditForm(ns, BUILDCONFIG_NAME);
        await buildConfigPage.ensureFormView();
      });

      await test.step('Verify Name field is visible', async () => {
        await expect(buildConfigPage.getNameField()).toBeVisible({ timeout: 30_000 });
      });

      await test.step('Verify Git repository URL section is visible', async () => {
        await expect(page.getByText('Git Repo URL')).toBeVisible();
      });

      await test.step('Verify Images section is visible', async () => {
        await expect(buildConfigPage.getSection('Images')).toBeVisible();
      });

      await test.step('Verify Environment Variables section is visible', async () => {
        await expect(buildConfigPage.getSection('Environment Variables')).toBeVisible();
      });
    },
  );

  test(
    'EBC-01-TC02: Advanced options show Triggers, Secrets, Run Policy, and Hooks sections',
    { tag: ['@regression'] },
    async ({ k8sClient, cleanup }) => {
      const ns = `aut-build-config-${Date.now()}`;

      await test.step('Create namespace and BuildConfig', async () => {
        await k8sClient.createNamespace(ns);
        await k8sClient.waitForNamespaceReady(ns);
        cleanup.trackNamespace(ns);
        await k8sClient.createCustomResource(
          'build.openshift.io',
          'v1',
          ns,
          'buildconfigs',
          createBuildConfigBody(ns, BUILDCONFIG_NAME),
        );
      });

      await test.step('Navigate to Edit Build Config form', async () => {
        await buildConfigPage.navigateToEditForm(ns, BUILDCONFIG_NAME);
        await buildConfigPage.ensureFormView();
      });

      await test.step('Expand Advanced options', async () => {
        await buildConfigPage.expandAdvancedOption('Triggers');
        await buildConfigPage.expandAdvancedOption('Secrets');
        await buildConfigPage.expandAdvancedOption('Run Policy');
        await buildConfigPage.expandAdvancedOption('Hooks');
      });

      await test.step('Verify Triggers section is visible', async () => {
        await expect(buildConfigPage.getSection('Triggers')).toBeVisible();
      });

      await test.step('Verify Secrets section is visible', async () => {
        await expect(buildConfigPage.getSection('Secrets')).toBeVisible();
      });

      await test.step('Verify Policy section is visible', async () => {
        await expect(buildConfigPage.getSection('Policy')).toBeVisible();
      });

      await test.step('Verify Hooks section is visible', async () => {
        await expect(buildConfigPage.getSection('Hooks')).toBeVisible();
      });
    },
  );
});
