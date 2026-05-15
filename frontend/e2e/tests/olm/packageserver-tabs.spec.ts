import { test, expect } from '../../fixtures';
import { DetailsPage } from '../../pages/details-page';
import { YamlEditorPage } from '../../pages/yaml-editor-page';

test.describe('PackageManifest tabs rendering', { tag: ['@admin'] }, () => {
  const csvNamespace = 'openshift-operator-lifecycle-manager';
  const csvName = 'packageserver';
  const packageManifestName = '3scale-operator';
  const baseUrl = `/k8s/ns/${csvNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}/packages.operators.coreos.com~v1~PackageManifest/${packageManifestName}`;
  const sectionHeader = 'PackageManifest overview';

  test('renders Details tab correctly', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await page.goto(baseUrl);
    await detailsPage.isLoaded();
    await detailsPage.titleShouldContain(packageManifestName);
    await detailsPage.sectionHeaderShouldExist(sectionHeader);
  });

  test('renders YAML tab correctly', async ({ page }) => {
    const yamlEditorPage = new YamlEditorPage(page);

    await page.goto(`${baseUrl}/yaml`);
    await yamlEditorPage.isLoaded();

    const content = await yamlEditorPage.getEditorContent();
    expect(content).toContain(packageManifestName);
    expect(content).toContain('PackageManifest');
  });

  test('renders Resources tab correctly', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await page.goto(`${baseUrl}/resources`);
    await detailsPage.isLoaded();
    await expect(page.getByTestId('console-empty-state')).toBeAttached();
  });

  test('renders Events tab correctly', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await page.goto(`${baseUrl}/events`);
    await detailsPage.isLoaded();
    await expect(page.getByTestId('console-empty-state')).toBeAttached();
  });

  test('allows navigation between tabs', async ({ page }) => {
    const detailsPage = new DetailsPage(page);
    const yamlEditorPage = new YamlEditorPage(page);

    await test.step('Start at Details tab', async () => {
      await page.goto(baseUrl);
      await detailsPage.isLoaded();
    });

    await test.step('Navigate to YAML tab', async () => {
      await detailsPage.selectTab('YAML');
      await yamlEditorPage.isLoaded();
      await expect(page).toHaveURL(/\/yaml/);
    });

    await test.step('Navigate to Resources tab', async () => {
      await detailsPage.selectTab('Resources');
      await detailsPage.isLoaded();
      await expect(page).toHaveURL(/\/resources/);
      await expect(page.getByTestId('console-empty-state')).toBeAttached();
    });

    await test.step('Navigate to Events tab', async () => {
      await detailsPage.selectTab('Events');
      await detailsPage.isLoaded();
      await expect(page).toHaveURL(/\/events/);
      await expect(page.getByTestId('console-empty-state')).toBeAttached();
    });

    await test.step('Navigate back to Details tab', async () => {
      await detailsPage.selectTab('Details');
      await detailsPage.isLoaded();
      await expect(page).not.toHaveURL(/\/yaml/);
      await expect(page).not.toHaveURL(/\/resources/);
      await expect(page).not.toHaveURL(/\/events/);
      await detailsPage.sectionHeaderShouldExist(sectionHeader);
    });
  });
});
