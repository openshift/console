import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';

const workloadTypes = [
  'replicationcontrollers',
  'daemonsets',
  'deployments',
  'replicasets',
  'statefulsets',
  'deploymentconfigs',
];

test.describe('Add storage for workloads', { tag: ['@admin'] }, () => {
  let namespace: string;

  test.beforeAll(async ({ k8sClient }) => {
    namespace = `test-storage-${Date.now()}`;
    await k8sClient.createNamespace(namespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(namespace);
  });

  for (const resourceType of workloadTypes) {
    test(`create ${resourceType} and add storage to it`, async ({ page }) => {
      const pvcName = `${resourceType}-pvc`;
      const pvcSize = '1';
      const mountPath = '/data';

      await test.step(`Create ${resourceType} via YAML editor`, async () => {
        if (resourceType === 'deployments' || resourceType === 'deploymentconfigs') {
          const name = `${namespace}-${resourceType}`;
          await page.goto(`/k8s/ns/${namespace}/${resourceType}/~new`);

          const yamlViewInput = page.getByTestId('yaml-view-input');
          if (await yamlViewInput.isVisible().catch(() => false)) {
            await yamlViewInput.click();
          }


          const content = await getEditorContent(page);
          const parsed = yaml.load(content) as Record<string, any>;
          parsed.metadata.name = name;
          if (resourceType === 'deploymentconfigs') {
            parsed.spec = parsed.spec || {};
            parsed.spec.selector = { app: name };
            parsed.spec.template = parsed.spec.template || {};
            parsed.spec.template.metadata = parsed.spec.template.metadata || {};
            parsed.spec.template.metadata.labels = { app: name };
          }
          await setEditorContent(page, yaml.dump(parsed, { sortKeys: true }));
        } else {
          await page.goto(`/k8s/ns/${namespace}/${resourceType}/~new`);
        }

        const saveButton = page.getByTestId('save-changes');
        const yamlError = page.getByTestId('yaml-error');
        await saveButton.click();
        await expect(yamlError).not.toBeAttached();
      });

      await test.step('Add storage via Actions dropdown', async () => {
        const details = new DetailsPage(page);
        await details.waitForPageLoad();
        await details.clickPageAction('Add storage');

        await page.getByTestId('Create new claim-radio-input').click();
        await page.getByTestId('pvc-name').fill(pvcName);
        await page.getByTestId('pvc-size').fill(pvcSize);
        await page.getByTestId('mount-path').fill(mountPath);

        const saveButton = page.getByTestId('save-changes');
        const yamlError = page.getByTestId('yaml-error');
        await saveButton.click();
        await expect(yamlError).not.toBeAttached();
      });

      await test.step('Verify storage is attached', async () => {
        await expect(page.getByTestId(`volume-name-${pvcName}`)).toHaveText(pvcName);
        await expect(page.getByTestId(`mount-path-${pvcName}`)).toHaveText(mountPath);
      });
    });
  }
});
