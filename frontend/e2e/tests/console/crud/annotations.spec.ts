import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { ModalPage } from '../../../pages/modal-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { generateTestName } from '../../../utils/test-name';

const configmapName = 'example';

const ANNOTATION_KEY = 'ALPHA_Num_KEY-3';
const ANNOTATION_VALUE = 'ALPHA_Num_VALUE-2';
const annotations = [
  { key: 'ALPHA_Num_KEY-1', value: 'ALPHA_Num_VALUE-1' },
  { key: 'ALPHA_Num_KEY-2', value: '' },
  { key: '', value: 'ALPHA_Num_VALUE-3' },
];

function getRow(modal: ModalPage, index: number) {
  return modal.getSubmitButton().page().getByTestId('pairs-list-row').nth(index);
}

test.describe('Annotations', { tag: ['@admin'] }, () => {
  test('creates, edits, updates, and deletes annotations', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const namespace = `${generateTestName()}-ann`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);
    const yamlEditor = new YamlEditorPage(page);
    const modal = new ModalPage(page);

    await test.step('Create ConfigMap via YAML editor', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps`);
      await listPage.clickCreateButton();
      await page.getByTestId('yaml-view-input').click();
      await yamlEditor.waitForEditorReady();

      const content = await getEditorContent(page);
      const parsed = yaml.load(content) as Record<string, unknown>;
      const merged = {
        ...(parsed as object),
        metadata: {
          ...((parsed as any)?.metadata || {}),
          name: configmapName,
        },
      };
      await setEditorContent(page, yaml.dump(merged, { sortKeys: true }));
      await yamlEditor.clickSave();
      await expect(yamlEditor.getYamlError()).not.toBeAttached();
    });

    await test.step('Navigate to ConfigMap details and open annotations modal', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps/${configmapName}`);
      await expect(detailsPage.getPageHeading()).toContainText(configmapName);
      await expect(page.getByTestId('edit-annotations')).toContainText('0 annotations');
      await detailsPage.clickPageAction('Edit annotations');
      await modal.waitForOpen();
    });

    await test.step('Add three annotations (third has no key)', async () => {
      const row0 = getRow(modal, 0);
      await row0.getByTestId('pairs-list-name').fill(annotations[0].key);
      await row0.getByTestId('pairs-list-value').fill(annotations[0].value);

      await page.getByTestId('add-button').click();
      const row1 = getRow(modal, 1);
      await row1.getByTestId('pairs-list-name').fill(annotations[1].key);

      await page.getByTestId('add-button').click();
      const row2 = getRow(modal, 2);
      await row2.getByTestId('pairs-list-value').fill(annotations[2].value);

      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify only 2 annotations saved (keyless annotation discarded)', async () => {
      await expect(page.getByTestId('edit-annotations')).toContainText('2 annotation');
      await detailsPage.clickPageAction('Edit annotations');
      await modal.waitForOpen();

      await expect(getRow(modal, 0).getByTestId('pairs-list-name')).toHaveValue(annotations[0].key);
      await expect(getRow(modal, 0).getByTestId('pairs-list-value')).toHaveValue(
        annotations[0].value,
      );
      await expect(getRow(modal, 1).getByTestId('pairs-list-name')).toHaveValue(annotations[1].key);
      await expect(getRow(modal, 1).getByTestId('pairs-list-value')).toHaveValue(
        annotations[1].value,
      );
    });

    await test.step('Update annotations: clear first value, set second, add third', async () => {
      await getRow(modal, 0).getByTestId('pairs-list-value').clear();

      await getRow(modal, 1).getByTestId('pairs-list-value').fill(ANNOTATION_VALUE);

      await page.getByTestId('add-button').click();
      const row2 = getRow(modal, 2);
      await row2.getByTestId('pairs-list-name').fill(ANNOTATION_KEY);
      await row2.getByTestId('pairs-list-value').fill(annotations[2].value);

      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify all 3 annotations after update', async () => {
      await expect(page.getByTestId('edit-annotations')).toContainText('3 annotations');
      await detailsPage.clickPageAction('Edit annotations');
      await modal.waitForOpen();

      await expect(getRow(modal, 0).getByTestId('pairs-list-name')).toHaveValue(annotations[0].key);
      await expect(getRow(modal, 0).getByTestId('pairs-list-value')).toHaveValue('');
      await expect(getRow(modal, 1).getByTestId('pairs-list-name')).toHaveValue(annotations[1].key);
      await expect(getRow(modal, 1).getByTestId('pairs-list-value')).toHaveValue(ANNOTATION_VALUE);
      await expect(getRow(modal, 2).getByTestId('pairs-list-name')).toHaveValue(ANNOTATION_KEY);
      await expect(getRow(modal, 2).getByTestId('pairs-list-value')).toHaveValue(
        annotations[2].value,
      );

      await modal.cancel();
      await modal.waitForClosed();
    });

    await test.step('Delete second annotation and verify', async () => {
      await detailsPage.clickPageAction('Edit annotations');
      await modal.waitForOpen();
      await page.getByTestId('delete-button').nth(1).click();
      await modal.submit();
      await modal.waitForClosed();

      await expect(page.getByTestId('edit-annotations')).toContainText('2 annotations');
      await detailsPage.clickPageAction('Edit annotations');
      await modal.waitForOpen();

      await expect(getRow(modal, 0).getByTestId('pairs-list-name')).toHaveValue(annotations[0].key);
      await expect(getRow(modal, 0).getByTestId('pairs-list-value')).toHaveValue('');
      await expect(getRow(modal, 1).getByTestId('pairs-list-name')).toHaveValue(ANNOTATION_KEY);
      await expect(getRow(modal, 1).getByTestId('pairs-list-value')).toHaveValue(
        annotations[2].value,
      );
    });

    await test.step('Delete all annotations', async () => {
      await page.getByTestId('delete-button').first().click();
      await page.getByTestId('delete-button').click();
      await modal.submit();
      await modal.waitForClosed();
      await expect(page.getByTestId('edit-annotations')).toContainText('0 annotations');
    });

    await test.step('Delete ConfigMap', async () => {
      await detailsPage.clickPageAction('Delete ConfigMap');
      await modal.waitForOpen();
      await modal.submit();
      await modal.waitForClosed();
    });
  });

  test('disables Save when annotations change externally', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const namespace = `${generateTestName()}-ann`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);
    const yamlEditor = new YamlEditorPage(page);
    const modal = new ModalPage(page);

    await test.step('Create ConfigMap via UI', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps`);
      await listPage.clickCreateButton();
      await page.getByTestId('yaml-view-input').click();
      await yamlEditor.waitForEditorReady();

      const content = await getEditorContent(page);
      const parsed = yaml.load(content) as Record<string, unknown>;
      const merged = {
        ...(parsed as object),
        metadata: { ...((parsed as any)?.metadata || {}), name: configmapName },
      };
      await setEditorContent(page, yaml.dump(merged, { sortKeys: true }));
      await yamlEditor.clickSave();
      await expect(yamlEditor.getYamlError()).not.toBeAttached();
    });

    await test.step('Open annotations modal', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps/${configmapName}`);
      await expect(page.getByTestId('edit-annotations')).toContainText('0 annotations');
      await detailsPage.clickPageAction('Edit annotations');
      await modal.waitForOpen();
    });

    await test.step('Add annotation via API and verify modal disables Save', async () => {
      await k8sClient.annotateConfigMap(configmapName, namespace, {
        [annotations[0].key]: annotations[0].value,
      });
      await expect(modal.getSubmitButton()).toBeDisabled({ timeout: 30_000 });
      await expect(page.getByTestId('button-bar-info-message')).toBeVisible();
    });

    await test.step('Cleanup: remove annotation and close modal', async () => {
      await k8sClient.annotateConfigMap(configmapName, namespace, {
        [annotations[0].key]: null,
      });
      await modal.cancel();
      await modal.waitForClosed();
    });

    await test.step('Delete ConfigMap', async () => {
      await detailsPage.clickPageAction('Delete ConfigMap');
      await modal.waitForOpen();
      await modal.submit();
      await modal.waitForClosed();
    });
  });
});
