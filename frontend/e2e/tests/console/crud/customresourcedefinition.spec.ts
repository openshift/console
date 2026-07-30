import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { generateTestName } from '../../../utils/test-name';

function deepDefaults(
  target: Record<string, unknown>,
  ...sources: Record<string, unknown>[]
): Record<string, unknown> {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        target[key] = deepDefaults(
          { ...(target[key] as Record<string, unknown>) },
          source[key] as Record<string, unknown>,
        );
      } else if (!(key in target)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

test.describe('CustomResourceDefinitions', { tag: ['@admin'] }, () => {
  test('creates, displays, and deletes a CRD and its custom resource instance', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const testName = generateTestName();
    const plural = `crd${testName}`;
    const group = 'test.example.com';
    const crdName = `${plural}.${group}`;
    const crdKind = `Crd${testName.charAt(0).toUpperCase()}${testName.slice(1)}`;
    const testLabel = 'automatedTestName';

    const listPage = new ListPage(page);
    const yamlEditor = new YamlEditorPage(page);
    const modal = new ModalPage(page);

    const namespace = `${testName}-crd`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    const crdDefinition = {
      apiVersion: 'apiextensions.k8s.io/v1',
      kind: 'CustomResourceDefinition',
      metadata: {
        name: crdName,
        labels: { [testLabel]: namespace },
      },
      spec: {
        group,
        versions: [
          {
            name: 'v1',
            served: true,
            storage: true,
            schema: {
              openAPIV3Schema: {
                type: 'object',
                properties: {
                  spec: {
                    type: 'object',
                    properties: {
                      cronSpec: { type: 'string' },
                      image: { type: 'string' },
                      replicas: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        ],
        scope: 'Namespaced',
        names: {
          plural,
          singular: plural,
          kind: crdKind,
          shortNames: [testName],
        },
      },
    };

    const customResource = {
      name: crdName,
      apiVersion: `${group}/v1`,
      kind: crdKind,
      metadata: {
        name: crdName,
        namespace,
      },
      spec: {},
      plural: 'customresourcedefinitions',
    };

    await test.step('Create CRD via YAML editor', async () => {
      await page.goto('/k8s/cluster/customresourcedefinitions');
      await listPage.clickCreateButton();
      await yamlEditor.waitForEditorReady();

      const content = await getEditorContent(page);
      const merged = deepDefaults(
        { ...crdDefinition },
        yaml.load(content) as Record<string, unknown>,
      );
      await setEditorContent(page, yaml.dump(merged, { sortKeys: true }));
      await yamlEditor.clickSave();
      await expect(yamlEditor.getYamlError()).not.toBeAttached();
      await expect(page).toHaveURL(
        new RegExp(`/k8s/cluster/customresourcedefinitions/${crdName}`),
      );
    });

    await test.step('Verify CRD in list and navigate to instances', async () => {
      await expect(async () => {
        await page.goto(`/k8s/cluster/customresourcedefinitions?name=${crdName}`);
        await expect(listPage.getCell(crdKind)).toBeVisible();
      }).toPass({ timeout: 90_000, intervals: [5_000] });
      await expect(async () => {
        await page.goto(`/k8s/all-namespaces/${group}~v1~${crdKind}`);
        await expect(page.getByTestId('empty-box')).toBeVisible();
      }).toPass({ timeout: 90_000, intervals: [5_000] });
      await expect(listPage.getCreateButton()).toBeVisible();
    });

    await test.step('Create custom resource instance via YAML editor', async () => {
      await listPage.clickCreateButton();
      await yamlEditor.waitForEditorReady();

      const content = await getEditorContent(page);
      const merged = deepDefaults(
        { ...customResource },
        yaml.load(content) as Record<string, unknown>,
      );
      await setEditorContent(page, yaml.dump(merged, { sortKeys: true }));
      await yamlEditor.clickSave();
      await expect(yamlEditor.getYamlError()).not.toBeAttached();
    });

    await test.step('Delete CRD via kebab action', async () => {
      await page.goto(`/k8s/cluster/customresourcedefinitions?name=${crdName}`);
      await expect(listPage.getCell(crdKind)).toBeVisible({ timeout: 60_000 });
      await listPage.clickKebabAction(crdKind, 'Delete CustomResourceDefinition');
      await modal.waitForOpen();
      await modal.submit();
      await modal.waitForClosed();
      await expect(listPage.getCell(crdKind)).not.toBeAttached({ timeout: 90_000 });
    });
  });
});
