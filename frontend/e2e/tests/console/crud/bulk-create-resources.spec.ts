import { test, expect } from '../../../fixtures';
import { setEditorContent } from '../../../pages/base-page';
import { generateTestName } from '../../../utils/test-name';

test.describe('Bulk import operation', { tag: ['@admin'] }, () => {
  test('fails to import duplicate yaml definitions (local validation)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const testName = generateTestName();
    const namespace = `${testName}-bulk`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    const dupSecrets = `apiVersion: v1
kind: Secret
metadata:
  name: secret-dup
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-dup
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame`;

    await page.goto(`/k8s/ns/${namespace}/import`);
    await expect(page.getByTestId('code-editor')).toBeVisible({ timeout: 30_000 });
    await setEditorContent(page, dupSecrets);
    await page.getByTestId('save-changes').click();
    await expect(page.getByTestId('yaml-error')).toBeAttached();
  });

  test('fails to import missing namespaced resources (server validation)', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const testName = generateTestName();
    const namespace = `${testName}-bulk`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    const missingNS = `apiVersion: v1
kind: Secret
metadata:
  name: example1
  namespace: missingns
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: example2
  namespace: missingns
type: Opaque
stringData:
  username: admin2
  password: opensesame`;

    await page.goto(`/k8s/ns/${namespace}/import`);
    await expect(page.getByTestId('code-editor')).toBeVisible({ timeout: 30_000 });
    await setEditorContent(page, missingNS);
    await page.getByTestId('save-changes').click();
    await expect(page.getByTestId('retry-failed-resources')).toBeAttached();
  });

  test('successfully imports three yaml secret definitions', async ({
    page,
    k8sClient,
    cleanup,
  }) => {
    const testName = generateTestName();
    const namespace = `${testName}-bulk`;
    await k8sClient.createNamespace(namespace);
    await k8sClient.waitForNamespaceReady(namespace);
    cleanup.trackNamespace(namespace);

    const threeSecrets = `apiVersion: v1
kind: Secret
metadata:
  name: secret-one
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-two
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame
---
apiVersion: v1
kind: Secret
metadata:
  name: secret-three
  namespace: ${namespace}
type: Opaque
stringData:
  username: admin1
  password: opensesame`;

    await page.goto(`/k8s/ns/${namespace}/import`);
    await expect(page.getByTestId('code-editor')).toBeVisible({ timeout: 30_000 });
    await setEditorContent(page, threeSecrets);
    await page.getByTestId('save-changes').click();

    await expect(page.getByTestId('yaml-error')).not.toBeAttached();
    await expect(page.getByTestId('secret-one')).toBeAttached();
    await expect(page.getByTestId('secret-two')).toBeAttached();
    await expect(page.getByTestId('secret-three')).toBeAttached();
    await expect(page.getByTestId(namespace)).toHaveCount(3);
    await expect(page.getByTestId('success-icon')).toHaveCount(4);
    await expect(page.getByTestId('import-more-yaml')).toBeAttached();

    await page.getByTestId('import-more-yaml').click();
  });
});
