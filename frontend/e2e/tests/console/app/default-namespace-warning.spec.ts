import { test, expect } from '../../../fixtures';
import { ListPage } from '../../../pages/list-page';
import { NamespaceBarPage } from '../../../pages/namespace-bar-page';
import { YamlEditorPage } from '../../../pages/yaml-editor-page';
import { generateTestName } from '../../../utils/test-name';

const DEFAULT_NAMESPACE = 'default';

const configMap = (namespace: string) => `apiVersion: v1
kind: ConfigMap
metadata:
  name: default-namespace-warning
  namespace: ${namespace}
data:
  key: value
`;

// The namespace is only read from, so it is created once for the whole file
// rather than per test.
test.describe('Default namespace security warnings', { tag: ['@admin'] }, () => {
  // The name must not contain "default": the dropdown filter matches substrings,
  // and the test asserts on how many entries a "default" filter returns.
  const userNamespace = `${generateTestName()}-ns-warning`;

  test.beforeAll(async ({ k8sClient }) => {
    await k8sClient.createNamespace(userNamespace);
    await k8sClient.waitForNamespaceReady(userNamespace);
  });

  test.afterAll(async ({ k8sClient }) => {
    await k8sClient.deleteNamespace(userNamespace);
  });

  test('warns in the namespace bar only while a default namespace is active', async ({ page }) => {
    const namespaceBar = new NamespaceBarPage(page);
    const listPage = new ListPage(page);

    await test.step('Default namespace shows the warning', async () => {
      await namespaceBar.navigateTo(`/k8s/ns/${DEFAULT_NAMESPACE}/pods`);
      await expect(namespaceBar.getWarningAlert()).toBeVisible({ timeout: 30_000 });
    });

    await test.step('User namespace shows no warning', async () => {
      await namespaceBar.navigateTo(`/k8s/ns/${userNamespace}/pods`);
      await expect(listPage.heading).toBeVisible({ timeout: 30_000 });
      await expect(namespaceBar.getWarningAlert()).toBeHidden();
    });
  });

  test('labels default namespaces in the namespace bar dropdown', async ({ page }) => {
    const namespaceBar = new NamespaceBarPage(page);

    await namespaceBar.navigateTo(`/k8s/ns/${userNamespace}/pods`);
    await namespaceBar.openDropdown();
    await namespaceBar.showDefaultNamespaces();

    await test.step('Default namespace is labelled', async () => {
      await namespaceBar.filterDropdown(DEFAULT_NAMESPACE);
      await expect(namespaceBar.getMenuItems()).toHaveCount(1);
      await expect(namespaceBar.getDefaultLabels()).toHaveCount(1);
    });

    await test.step('User namespace is not labelled', async () => {
      await namespaceBar.filterDropdown(userNamespace);
      await expect(namespaceBar.getMenuItems()).toHaveCount(1);
      await expect(namespaceBar.getDefaultLabels()).toHaveCount(0);
    });
  });

  test('warns on the import YAML page when the manifest targets a default namespace', async ({
    page,
  }) => {
    const yamlPage = new YamlEditorPage(page);

    await yamlPage.navigateToImportYaml(userNamespace);
    await yamlPage.waitForEditorReady();

    await test.step('Manifest targeting a user namespace shows no warning', async () => {
      await yamlPage.setEditorContent(configMap(userNamespace));
      await expect(yamlPage.getDefaultNamespaceDeploymentWarning()).toBeHidden();
    });

    await test.step('Manifest targeting a default namespace shows the warning', async () => {
      await yamlPage.setEditorContent(configMap(DEFAULT_NAMESPACE));
      await expect(yamlPage.getDefaultNamespaceDeploymentWarning()).toBeVisible();
    });
  });
});
