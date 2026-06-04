import { Page, expect } from '@playwright/test';
import jsYaml from 'js-yaml';
import KubernetesClient from '../../../clients/kubernetes-client';
import { getEditorContent, setEditorContent } from '../../../pages/base-page';

const CRD_LIST_URL = '/k8s/cluster/apiextensions.k8s.io~v1~CustomResourceDefinition';

/**
 * Navigate to CRD instances page via kebab menu "View instances"
 */
export async function navigateToCRDInstances(page: Page, crd: string): Promise<void> {
  await page.goto(CRD_LIST_URL);

  const searchInput = page.locator('input[placeholder="Filter by name"]');
  await searchInput.fill(crd);

  const crdRow = page.getByRole('row', { name: new RegExp(crd, 'i') });
  await expect(crdRow).toBeVisible({ timeout: 30000 });

  const kebabButton = crdRow.getByTestId('kebab-button');
  await kebabButton.click();
  await page.getByRole('menuitem', { name: 'View instances' }).click();

  await expect(page.getByRole('heading', { name: crd })).toBeVisible();
}

/**
 * Navigate to CRD details page via link click, then switch to Instances tab
 */
export async function navigateToCRDInstancesViaDetails(page: Page, crd: string): Promise<void> {
  await page.goto(CRD_LIST_URL);

  const searchInput = page.locator('input[placeholder="Filter by name"]');
  await searchInput.fill(crd);

  const crdRow = page.getByRole('row', { name: new RegExp(crd, 'i') });
  await expect(crdRow).toBeVisible({ timeout: 30000 });

  const crdLink = crdRow.getByRole('link', { name: new RegExp(crd, 'i') });
  await crdLink.click();

  await page.getByRole('tab', { name: 'Instances' }).click();
  await expect(page.getByRole('heading', { name: crd })).toBeVisible();
}

/**
 * Wait for Monaco YAML editor to load and be ready
 */
export async function waitForYamlEditor(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Copy code to clipboard' })).toBeVisible();
}

/**
 * Get the current content from the Monaco YAML editor
 */
export async function getYamlEditorContent(page: Page): Promise<string> {
  return getEditorContent(page);
}

/**
 * Set content in the Monaco YAML editor
 */
export async function setYamlEditorContent(page: Page, yaml: string): Promise<void> {
  await setEditorContent(page, yaml);
}

/**
 * Merge an object with the existing YAML editor content and set it
 */
export async function mergeYamlEditorContent(page: Page, obj: any): Promise<void> {
  const existingContent = await getYamlEditorContent(page);
  const parsed = jsYaml.load(existingContent);
  const existingObj: Record<string, any> =
    typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, any>) : {};
  const mergedObj = { ...existingObj, ...obj };
  const newYaml = jsYaml.dump(mergedObj, { sortKeys: true });
  await setYamlEditorContent(page, newYaml);
}

/**
 * Replace the entire YAML editor content with a new object
 */
export async function replaceYamlEditorContent(page: Page, obj: any): Promise<void> {
  const newYaml = jsYaml.dump(obj, { sortKeys: true });
  await setYamlEditorContent(page, newYaml);
}

/**
 * Save YAML changes and verify no errors
 */
export async function saveYamlChanges(page: Page): Promise<void> {
  await page.getByTestId('save-changes').click();
  await expect(page.getByTestId('yaml-error')).toBeHidden();
}

/**
 * Create a custom resource via YAML editor by merging with template
 */
export async function createCustomResourceViaYaml(page: Page, obj: any): Promise<void> {
  await page.getByTestId('item-create').click();
  await waitForYamlEditor(page);
  await mergeYamlEditorContent(page, obj);
  await saveYamlChanges(page);
}

/**
 * Update a custom resource via YAML editor by modifying existing content
 */
export async function updateCustomResourceViaYaml(
  page: Page,
  modifier: (existingObj: any) => any,
): Promise<void> {
  await waitForYamlEditor(page);

  const existingContent = await getYamlEditorContent(page);
  const existingObj = jsYaml.load(existingContent) as Record<string, any>;
  const modifiedObj = modifier(existingObj);
  const newYaml = jsYaml.dump(modifiedObj, { sortKeys: true });

  await setYamlEditorContent(page, newYaml);
  await saveYamlChanges(page);
}

/**
 * Delete a custom resource and verify it's gone from the list
 */
export async function deleteCustomResourceAndVerify(
  page: Page,
  k8sClient: KubernetesClient,
  apiGroup: string,
  version: string,
  namespace: string,
  plural: string,
  name: string,
  crd: string,
): Promise<void> {
  await k8sClient.deleteCustomResource(apiGroup, version, namespace, plural, name);

  // Verify deletion by checking the instance is gone
  await page.goto(`/k8s/cluster/${apiGroup}~${version}~${crd}`);
  const instanceRow = page.getByRole('row', { name: new RegExp(name) });
  await expect(instanceRow).not.toBeVisible({ timeout: 10000 });
}
