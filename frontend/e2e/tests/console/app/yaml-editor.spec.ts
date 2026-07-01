import { test, expect } from '../../../fixtures';
import { warmupSPA } from '../../../pages/base-page';
import { DetailsPage } from '../../../pages/details-page';
import { ListPage } from '../../../pages/list-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';

const YAML_SAMPLE = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
  namespace: default
data:
  key: value`;

test.describe('YAML Editor Settings', { tag: ['@admin', '@yaml-editor'] }, () => {
  let yamlEditorPage: YamlEditorPage;

  test.beforeEach(async ({ page }) => {
    await warmupSPA(page);
    yamlEditorPage = new YamlEditorPage(page);
    await yamlEditorPage.navigateToImportYaml();
    await yamlEditorPage.waitForEditorReady();
  });

  test('should open and close the editor settings modal', async () => {
    await yamlEditorPage.openSettingsModal();
    await expect(yamlEditorPage.getSettingsModal()).toBeVisible();
    await expect(yamlEditorPage.getSettingsModalTitle()).toContainText('Editor settings');
    await expect(yamlEditorPage.getSettingsModalBody()).toBeVisible();

    await yamlEditorPage.closeSettingsModal();
    await expect(yamlEditorPage.getSettingsModal()).not.toBeAttached();
  });

  test('should toggle theme to Dark mode', async () => {
    await yamlEditorPage.openSettingsModal();
    await yamlEditorPage.selectTheme('Dark');
    await expect(yamlEditorPage.getMonacoEditor()).toHaveClass(/vs-dark/);
    await yamlEditorPage.closeSettingsModal();
  });

  test('should toggle theme to Light mode', async () => {
    await yamlEditorPage.openSettingsModal();
    await yamlEditorPage.selectTheme('Light');
    await expect(yamlEditorPage.getMonacoEditor()).toHaveClass(/\bvs(?!-)\b/);
    await yamlEditorPage.closeSettingsModal();
  });

  test('should revert to default theme setting', async () => {
    await yamlEditorPage.openSettingsModal();
    await yamlEditorPage.selectTheme('Dark');
    await expect(yamlEditorPage.getMonacoEditor()).toHaveClass(/vs-dark/);
    await yamlEditorPage.selectTheme('Use theme setting');
    await expect(yamlEditorPage.getMonacoEditor()).not.toHaveClass(/vs-dark/);
    await yamlEditorPage.closeSettingsModal();
  });

  test('should increase font size', async () => {
    await yamlEditorPage.setEditorContent(YAML_SAMPLE);
    await yamlEditorPage.openSettingsModal();

    const initialSize = Number(await yamlEditorPage.getFontSizeInput().inputValue());
    await yamlEditorPage.getFontSizeIncreaseButton().click();
    await yamlEditorPage.getFontSizeIncreaseButton().click();

    await expect(yamlEditorPage.getFontSizeInput()).toHaveValue(String(initialSize + 2));
    await expect(yamlEditorPage.getMonacoViewLines()).toHaveCSS(
      'font-size',
      `${initialSize + 2}px`,
    );
    await yamlEditorPage.closeSettingsModal();
  });

  test('should decrease font size', async () => {
    await yamlEditorPage.setEditorContent(YAML_SAMPLE);
    await yamlEditorPage.openSettingsModal();

    const initialSize = Number(await yamlEditorPage.getFontSizeInput().inputValue());
    await yamlEditorPage.getFontSizeDecreaseButton().click();

    await expect(yamlEditorPage.getFontSizeInput()).toHaveValue(String(initialSize - 1));
    await expect(yamlEditorPage.getMonacoViewLines()).toHaveCSS(
      'font-size',
      `${initialSize - 1}px`,
    );
    await yamlEditorPage.closeSettingsModal();
  });

  test('should not decrease font size below minimum (5px)', async () => {
    await yamlEditorPage.openSettingsModal();
    await yamlEditorPage.setFontSize(5);
    await expect(yamlEditorPage.getFontSizeDecreaseButton()).toBeDisabled();
    await yamlEditorPage.closeSettingsModal();
  });

  test('should allow manual font size input', async () => {
    await yamlEditorPage.setEditorContent(YAML_SAMPLE);
    await yamlEditorPage.openSettingsModal();
    await yamlEditorPage.setFontSize(18);

    await expect(yamlEditorPage.getFontSizeInput()).toHaveValue('18');
    await expect(yamlEditorPage.getMonacoViewLines()).toHaveCSS('font-size', '18px');
    await yamlEditorPage.closeSettingsModal();
  });

  test('should persist settings after modal close and reopen', async () => {
    await yamlEditorPage.openSettingsModal();
    await yamlEditorPage.selectTheme('Dark');
    await yamlEditorPage.setFontSize(16);
    await yamlEditorPage.closeSettingsModal();

    await yamlEditorPage.openSettingsModal();
    await expect(yamlEditorPage.getMonacoEditor()).toHaveClass(/vs-dark/);
    await expect(yamlEditorPage.getFontSizeInput()).toHaveValue('16');
    await yamlEditorPage.closeSettingsModal();
  });

  test('should persist user settings across pages', async ({ page }) => {
    const listPage = new ListPage(page);
    const detailsPage = new DetailsPage(page);

    await test.step('Set custom settings on import YAML page', async () => {
      await yamlEditorPage.openSettingsModal();
      await yamlEditorPage.selectTheme('Light');
      await yamlEditorPage.setFontSize(20);
      await yamlEditorPage.closeSettingsModal();

      await expect(yamlEditorPage.getMonacoEditor()).toHaveClass(/\bvs(?!-)\b/);
      await expect(yamlEditorPage.getMonacoViewLines()).toHaveCSS('font-size', '20px');
    });

    await test.step('Navigate to a pod YAML page', async () => {
      await page.goto('/k8s/ns/openshift-console/pods');
      await expect(listPage.getDataViewTable()).toBeVisible({ timeout: 60_000 });
      await listPage.clickFirstRowLink();
      await detailsPage.selectTab('YAML');
      await expect(yamlEditorPage.getMonacoEditor()).toBeVisible({ timeout: 30_000 });
    });

    await test.step('Verify settings persisted across page navigation', async () => {
      await expect(yamlEditorPage.getMonacoEditor()).toHaveClass(/\bvs(?!-)\b/);
      await expect(yamlEditorPage.getMonacoViewLines()).toHaveCSS('font-size', '20px');
    });
  });
});

test.describe('YAML editor sidebar', { tag: ['@admin', '@yaml-editor'] }, () => {
  test('should show possible enum values in yaml sidebar', async ({ page }) => {
    await warmupSPA(page);
    const yamlEditorPage = new YamlEditorPage(page);

    await test.step('Navigate to downloads deployment YAML', async () => {
      await page.goto('/k8s/ns/openshift-console/deployments/downloads/yaml');
      await yamlEditorPage.waitForEditorReady();
    });

    await test.step('Show sidebar', async () => {
      await yamlEditorPage.showSidebar();
    });

    await test.step('Navigate to spec > strategy and verify enum values', async () => {
      await expect(page.getByRole('tab', { name: 'Schema' })).toBeVisible();
      await yamlEditorPage.clickFieldDetailsButton('spec');
      await yamlEditorPage.clickFieldDetailsButton('strategy');
      await expect(page.getByText('Allowed values:')).toBeVisible();
      await expect(page.getByText('Recreate, RollingUpdate')).toBeVisible();
    });
  });
});
