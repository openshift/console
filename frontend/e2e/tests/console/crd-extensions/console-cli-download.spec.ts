import { test, expect } from '../../../fixtures';
import KubernetesClient from '../../../clients/kubernetes-client';
import {
  createCustomResourceViaYaml,
  deleteCustomResourceAndVerify,
  navigateToCRDInstances,
} from './crd-test-utils';

const crd = 'ConsoleCLIDownload';

test.describe(`${crd} CRD`, { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;
  let name: string;
  let crdObj: any;

  test.beforeEach(async ({ k8sClient: client }) => {
    k8sClient = client;

    // Generate unique name for each test run
    name = `console-cli-download-test-${Date.now()}`;

    // Cannot use default YAML template since it contains new lines
    // in the description and that breaks with load
    crdObj = {
      apiVersion: 'console.openshift.io/v1',
      kind: crd,
      metadata: {
        name,
      },
      spec: {
        displayName: name,
        description:
          'This is an example CLI download description that can include markdown such as paragraphs, unordered lists, code, [links](https://www.example.com), etc.',
        links: [{ href: 'https://www.example.com', text: 'Example CLI Download' }],
      },
    };
  });

  test.afterEach(async () => {
    // Clean up the ConsoleCLIDownload instance
    try {
      await k8sClient.deleteCustomResource(
        'console.openshift.io',
        'v1',
        '',
        'consoleclidownloads',
        name,
      );
    } catch (error) {
      // Ignore if already deleted
    }
  });

  test(`creates, displays, and deletes a new ${crd} instance`, async ({ page }) => {
    await test.step('Navigate to CRD instances page', async () => {
      await navigateToCRDInstances(page, crd);
    });

    await test.step('Create ConsoleCLIDownload instance via YAML editor', async () => {
      await createCustomResourceViaYaml(page, crdObj);
    });

    await test.step('Verify instance appears on details page', async () => {
      // YAML save redirects to the created resource — no goto needed
      await expect(page.getByRole('heading', { name })).toBeVisible();
    });

    await test.step('Verify instance appears on Command Line Tools page', async () => {
      await page.goto('/command-line-tools');
      await expect(page.locator(`[data-test-id="${name}"]`)).toContainText(name);
    });

    await test.step('Delete the ConsoleCLIDownload instance', async () => {
      await deleteCustomResourceAndVerify(
        page,
        k8sClient,
        'console.openshift.io',
        'v1',
        '',
        'consoleclidownloads',
        name,
        crd,
      );
    });
  });
});
