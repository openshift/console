import { test, expect } from '../../../fixtures';
import KubernetesClient from '../../../clients/kubernetes-client';
import {
  createCustomResourceViaYaml,
  navigateToCRDInstances,
  saveYamlChanges,
  waitForYamlEditor,
} from './crd-test-utils';

const crd = 'ConsoleYAMLSample';
const testJobName = 'test-job';

test.describe(`${crd} CRD`, { tag: ['@admin'] }, () => {
  let k8sClient: KubernetesClient;

  test.beforeEach(async ({ k8sClient: client }) => {
    k8sClient = client;
  });

  test(`creates, displays, tests, and deletes a new ${crd} instance`, async ({ page }) => {
    const name = `console-yaml-sample-test-${Date.now()}`;
    const projectName = `test-project-${Date.now()}`;

    const crdObj = {
      apiVersion: 'console.openshift.io/v1',
      kind: crd,
      metadata: {
        name,
      },
      spec: {
        targetResource: {
          apiVersion: 'batch/v1',
          kind: 'Job',
        },
        title: 'Example Job',
        description: 'An example Job YAML sample',
        yaml: `apiVersion: batch/v1
kind: Job
metadata:
  name: ${testJobName}
  namespace: ${projectName}
spec:
  template:
    metadata:
      name: countdown
      namespace: ${projectName}
    spec:
      containers:
      - name: counter
        image: centos:7
        command:
        - "bin/bash"
        - "-c"
        - "echo Test"
      restartPolicy: Never`,
      },
    };

    await k8sClient.createNamespace(projectName);

    try {
      await test.step('Navigate to CRD instances page', async () => {
        await navigateToCRDInstances(page, crd);
      });

      await test.step('Create ConsoleYAMLSample instance via YAML editor', async () => {
        await createCustomResourceViaYaml(page, crdObj);
      });

      await test.step('Verify no additional printer columns on list page', async () => {
        await page.goto(`/k8s/cluster/console.openshift.io~v1~${crd}`);

        // Additional printer columns should not exist for this CRD
        await expect(
          page.getByTestId(/^additional-printer-column-header-/).first(),
        ).toBeHidden();

        // Created column should exist since Age does not
        await expect(page.getByTestId('column-header-Created')).toBeVisible();
      });

      await test.step('Verify instance on details page', async () => {
        // Navigate to details by clicking the instance link on the list page
        // Using goto can cause a full page reload where model discovery races
        const instanceRow = page.getByRole('row', { name: new RegExp(name) });
        await instanceRow.getByRole('link', { name }).click();
        await expect(page.getByRole('heading', { name })).toBeVisible();

        // Additional printer columns should not exist
        await expect(page.getByTestId('additional-printer-columns')).toBeHidden();
      });

      await test.step('Create Job from YAML sample via resource sidebar', async () => {
        await page.goto(`/k8s/ns/${projectName}/batch~v1~Job`);
        await page.getByTestId('item-create').click();

        await waitForYamlEditor(page);

        // Switch to Samples tab in the resource sidebar
        await page.getByRole('tab', { name: 'Samples' }).click();

        // Wait for sample to load and click "Try it" to load into editor
        await page.getByTestId('load-sample').first().click();

        await saveYamlChanges(page);
      });

      await test.step('Verify Job was created from sample', async () => {
        await page.goto(`/k8s/ns/${projectName}/batch~v1~Job/${testJobName}`);
        await expect(page.getByRole('heading', { name: testJobName })).toBeVisible();
      });

      await test.step('Delete the ConsoleYAMLSample instance', async () => {
        await k8sClient.deleteCustomResource(
          'console.openshift.io',
          'v1',
          '',
          'consoleyamlsamples',
          name,
        );
      });
    } finally {
      try {
        await k8sClient.deleteCustomResource(
          'console.openshift.io',
          'v1',
          '',
          'consoleyamlsamples',
          name,
        );
      } catch (error) {
        // Ignore if already deleted
      }
      try {
        await k8sClient.deleteNamespace(projectName);
      } catch (error) {
        // Ignore if already deleted
      }
    }
  });
});
