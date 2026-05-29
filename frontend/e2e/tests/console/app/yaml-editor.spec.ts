import { test, expect } from '../../../fixtures';
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

test.describe('YAML Editor Settings', { tag: ['@admin'] }, () => {
  test('settings modal opens, verifies content, and closes', async ({ page }) => {
    const editor = new YamlEditorPage(page);
    await editor.navigateToImport();

    await test.step('open editor settings modal', async () => {
      await editor.openSettings();
      await expect(editor.settingsModalLocator).toBeVisible();
      await expect(page.locator('#edit-yaml-settings-modal-title')).toContainText(
        'Editor settings',
      );
    });

    await test.step('close editor settings modal', async () => {
      await editor.closeSettings();
      await expect(editor.settingsModalLocator).not.toBeAttached();
    });
  });

  test('theme setting toggles between Dark, Light, and default', async ({ page }) => {
    const editor = new YamlEditorPage(page);
    await editor.navigateToImport();

    await test.step('toggle to Dark mode', async () => {
      await editor.openSettings();
      await editor.selectTheme('Dark');
      await expect(page.locator('.monaco-editor')).toHaveClass(/vs-dark/);
      await editor.closeSettings();
    });

    await test.step('toggle to Light mode', async () => {
      await editor.openSettings();
      await editor.selectTheme('Light');
      await expect(page.locator('.monaco-editor')).toHaveClass(/\bvs\b/);
      await expect(page.locator('.monaco-editor')).not.toHaveClass(/vs-dark/);
      await editor.closeSettings();
    });

    await test.step('revert to default theme', async () => {
      await editor.openSettings();
      await editor.selectTheme('Use theme setting');
      await expect(page.locator('.monaco-editor')).toBeVisible();
      await editor.closeSettings();
    });
  });

  test('font size controls work correctly', async ({ page }) => {
    const editor = new YamlEditorPage(page);
    await editor.navigateToImport();
    await editor.setEditorContent(YAML_SAMPLE);

    await test.step('increase font size by 2', async () => {
      await editor.openSettings();
      const initialSize = Number(await editor.fontSizeInputLocator.inputValue());
      await editor.fontSizeIncreaseLocator.click();
      await editor.fontSizeIncreaseLocator.click();
      await expect(editor.fontSizeInputLocator).toHaveValue(String(initialSize + 2));
      await expect(page.locator('.monaco-editor .view-lines')).toHaveCSS(
        'font-size',
        `${initialSize + 2}px`,
      );
      await editor.closeSettings();
    });

    await test.step('decrease font size by 1', async () => {
      await editor.openSettings();
      const currentSize = Number(await editor.fontSizeInputLocator.inputValue());
      await editor.fontSizeDecreaseLocator.click();
      await expect(editor.fontSizeInputLocator).toHaveValue(String(currentSize - 1));
      await expect(page.locator('.monaco-editor .view-lines')).toHaveCSS(
        'font-size',
        `${currentSize - 1}px`,
      );
      await editor.closeSettings();
    });

    await test.step('minimum font size is 5px', async () => {
      await editor.openSettings();
      await editor.setFontSize(5);
      await expect(editor.fontSizeDecreaseLocator).toBeDisabled();
      await editor.closeSettings();
    });

    await test.step('manual font size input', async () => {
      await editor.openSettings();
      await editor.setFontSize(18);
      await expect(editor.fontSizeInputLocator).toHaveValue('18');
      await expect(page.locator('.monaco-editor .view-lines')).toHaveCSS('font-size', '18px');
      await editor.closeSettings();
    });
  });

  test('settings persist after modal close and reopen', async ({ page }) => {
    const editor = new YamlEditorPage(page);
    await editor.navigateToImport();

    await editor.openSettings();
    await editor.selectTheme('Dark');
    await editor.setFontSize(16);
    await editor.closeSettings();

    await editor.openSettings();
    await expect(page.locator('.monaco-editor')).toHaveClass(/vs-dark/);
    await expect(editor.fontSizeInputLocator).toHaveValue('16');
    await editor.closeSettings();
  });

  test('settings persist across pages', async ({ page }) => {
    const editor = new YamlEditorPage(page);
    const list = new ListPage(page);
    const details = new DetailsPage(page);

    await test.step('set custom settings on import page', async () => {
      await editor.navigateToImport();
      await editor.openSettings();
      await editor.selectTheme('Light');
      await editor.setFontSize(20);
      await editor.closeSettings();

      await expect(page.locator('.monaco-editor')).toHaveClass(/\bvs\b/);
      await expect(page.locator('.monaco-editor .view-lines')).toHaveCSS('font-size', '20px');
    });

    await test.step('verify settings persist on a different YAML page', async () => {
      await page.goto('/k8s/ns/openshift-console/pods');
      await list.waitForRows();
      await list.clickFirstRowLink();
      await details.waitForLoaded();
      await details.selectTab('YAML');
      await page.locator('.monaco-editor').waitFor({ state: 'visible', timeout: 30_000 });

      await expect(page.locator('.monaco-editor')).toHaveClass(/\bvs\b/);
      await expect(page.locator('.monaco-editor .view-lines')).toHaveCSS('font-size', '20px');
    });
  });
});

test.describe('YAML editor sidebar', { tag: ['@admin'] }, () => {
  test('shows enum values in schema sidebar for Deployment', async ({ page, baseURL }) => {
    const isLocalhost = (() => {
      try {
        return new URL(baseURL ?? '').hostname === 'localhost';
      } catch {
        return false;
      }
    })();
    test.skip(isLocalhost, 'Resource models unavailable in off-cluster mode');
    const editor = new YamlEditorPage(page);

    await page.goto('/k8s/ns/openshift-console/deployments/downloads/yaml');
    await editor.waitForMonacoReady();

    await test.step('open sidebar and verify schema tab', async () => {
      await editor.openSidebar();
      await expect(page.getByText('Schema')).toBeVisible();
    });

    await test.step('drill into spec > strategy and verify enum values', async () => {
      await editor.clickFieldDetails('spec');
      await editor.clickFieldDetails('strategy');
      await expect(page.locator('p', { hasText: 'Allowed values:' })).toBeVisible();
      await expect(page.getByText('Recreate, RollingUpdate')).toBeVisible();
    });
  });
});
