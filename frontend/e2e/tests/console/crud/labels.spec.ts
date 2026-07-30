import yaml from 'js-yaml';

import { test, expect } from '../../../fixtures';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';
import { ModalPage } from '../../../pages/modal-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { generateTestName } from '../../../utils/test-name';

test.describe('Editing labels', { tag: ['@admin'] }, () => {
  const label1Key = 'label1';
  const label1 = `${label1Key}=label1`;
  const configmapName = 'editlabels';

  test('adds a label, verifies on details page, and navigates via label link to search', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const testName = generateTestName();
    const namespace = `${testName}-lbl`;
    const detailsPage = new DetailsPage(page);
    const yamlEditor = new YamlEditorPage(page);
    const modal = new ModalPage(page);

    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    await test.step('Create ConfigMap via YAML editor', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps/~new`);
      await yamlEditor.waitForEditorReady();
      const content = await getEditorContent(page);
      const parsed = yaml.load(content) as Record<string, unknown>;
      const merged = {
        ...(parsed as object),
        metadata: { ...((parsed as any)?.metadata || {}), name: configmapName, namespace },
      };
      await setEditorContent(page, yaml.dump(merged, { sortKeys: true }));
      await yamlEditor.clickSave();
      await expect(yamlEditor.getYamlError()).not.toBeAttached();
    });

    await test.step('Add label via modal', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps/${configmapName}`);
      await detailsPage.clickPageAction('Edit labels');
      await modal.waitForOpen();
      await page.getByTestId('tags-input').pressSequentially(`${label1}`, { delay: 50 });
      await page.getByTestId('tags-input').press('Enter');
      await modal.submit();
      await modal.waitForClosed();
    });

    await test.step('Verify label on details page', async () => {
      await expect(page.getByTestId('label-key')).toContainText(label1Key);
    });

    await test.step('Click label to navigate to search and verify chip', async () => {
      await page.getByTestId('label-key').click();
      await expect(page).toHaveURL(
        new RegExp(`/search.*kind=core(~|%7E)v1(~|%7E)ConfigMap.*q=${encodeURIComponent(label1)}`),
      );
      await expect(page.locator('#search-toolbar')).toContainText(label1);
    });
  });

  test('disables Save when labels change externally', async ({ page, k8sClient, cleanup }) => {
    const testName = generateTestName();
    const namespace = `${testName}-lbl`;
    const detailsPage = new DetailsPage(page);
    const yamlEditor = new YamlEditorPage(page);
    const modal = new ModalPage(page);

    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    await test.step('Create ConfigMap via YAML editor', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps/~new`);
      await yamlEditor.waitForEditorReady();
      const content = await getEditorContent(page);
      const parsed = yaml.load(content) as Record<string, unknown>;
      const merged = {
        ...(parsed as object),
        metadata: { ...((parsed as any)?.metadata || {}), name: configmapName, namespace },
      };
      await setEditorContent(page, yaml.dump(merged, { sortKeys: true }));
      await yamlEditor.clickSave();
      await expect(yamlEditor.getYamlError()).not.toBeAttached();
    });

    await test.step('Open label modal', async () => {
      await page.goto(`/k8s/ns/${namespace}/configmaps/${configmapName}`);
      await detailsPage.clickPageAction('Edit labels');
      await modal.waitForOpen();
    });

    await test.step('Add label via API and verify modal disables Save', async () => {
      await k8sClient.labelConfigMap(configmapName, namespace, { [label1Key]: 'label1' });
      await expect(modal.getSubmitButton()).toBeDisabled({ timeout: 30_000 });
      await expect(page.getByTestId('button-bar-info-message')).toBeVisible();
    });

    await test.step('Cleanup: remove label and close modal', async () => {
      await k8sClient.labelConfigMap(configmapName, namespace, { [label1Key]: null });
      await modal.cancel();
      await modal.waitForClosed();
    });
  });
});
