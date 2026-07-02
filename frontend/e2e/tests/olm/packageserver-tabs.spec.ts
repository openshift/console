import { test, expect } from '../../fixtures';
import { DetailsPage } from '../../pages/details-page';
import { YamlEditorPage } from '../../pages/yaml-editor-page';

test.describe('packageserver PackageManifest tabs rendering', { tag: ['@admin'] }, () => {
  const csvNamespace = 'openshift-operator-lifecycle-manager';
  const csvName = 'packageserver';
  const packageManifestName = '3scale-operator';
  const baseUrl = `/k8s/ns/${csvNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}/packages.operators.coreos.com~v1~PackageManifest/${packageManifestName}`;
  const sectionHeader = 'PackageManifest overview';

  test('renders Details tab correctly', async ({ page }) => {
    await test.step('Navigate to PackageManifest Details tab', async () => {
      const detailsPage = new DetailsPage(page);
      await detailsPage.navigateToDetailsUrl(baseUrl);
    });

    await test.step('Verify page title shows package name', async () => {
      const detailsPage = new DetailsPage(page);
      await expect(detailsPage.title).toContainText(packageManifestName);
    });

    await test.step('Verify Details section header exists', async () => {
      const detailsPage = new DetailsPage(page);
      await expect(detailsPage.getSectionHeader(sectionHeader)).toBeVisible();
    });
  });

  test('renders YAML tab correctly', async ({ page }) => {
    await test.step('Navigate to PackageManifest YAML tab', async () => {
      const yamlEditor = new YamlEditorPage(page);
      await yamlEditor.navigateToYamlUrl(`${baseUrl}/yaml`);
    });

    await test.step('Verify YAML contains package manifest metadata', async () => {
      const yamlEditor = new YamlEditorPage(page);
      const content = await yamlEditor.getEditorContent();
      expect(content).toContain(packageManifestName);
      expect(content).toContain('PackageManifest');
    });
  });

  test('renders Resources tab correctly', async ({ page }) => {
    await test.step('Navigate to PackageManifest Resources tab', async () => {
      const detailsPage = new DetailsPage(page);
      await detailsPage.navigateToDetailsUrl(`${baseUrl}/resources`);
    });

    await test.step('Verify resource list is empty', async () => {
      const detailsPage = new DetailsPage(page);
      await expect(detailsPage.getEmptyState()).toBeVisible();
    });
  });

  test('renders Events tab correctly', async ({ page }) => {
    await test.step('Navigate to PackageManifest Events tab', async () => {
      const detailsPage = new DetailsPage(page);
      await detailsPage.navigateToDetailsUrl(`${baseUrl}/events`);
    });

    await test.step('Verify events stream component is empty', async () => {
      const detailsPage = new DetailsPage(page);
      await expect(detailsPage.getEmptyState()).toBeVisible();
    });
  });

  test('allows navigation between tabs', async ({ page }) => {
    const detailsPage = new DetailsPage(page);
    const yamlEditor = new YamlEditorPage(page);

    await test.step('Start at Details tab', async () => {
      await detailsPage.navigateToDetailsUrl(baseUrl);
    });

    await test.step('Navigate to YAML tab', async () => {
      await detailsPage.selectTab('YAML');
      await yamlEditor.waitForEditorReady();
      await expect(page).toHaveURL(new RegExp('/yaml'));
    });

    await test.step('Navigate to Resources tab', async () => {
      await detailsPage.selectTab('Resources');
      await detailsPage.waitForPageLoad();
      await expect(page).toHaveURL(new RegExp('/resources'));
      await expect(detailsPage.getEmptyState()).toBeVisible();
    });

    await test.step('Navigate to Events tab', async () => {
      await detailsPage.selectTab('Events');
      await detailsPage.waitForPageLoad();
      await expect(page).toHaveURL(new RegExp('/events'));
      await expect(detailsPage.getEmptyState()).toBeVisible();
    });

    await test.step('Navigate back to Details tab', async () => {
      await detailsPage.selectTab('Details');
      await detailsPage.waitForPageLoad();
      await expect(page).not.toHaveURL(new RegExp('/yaml'));
      await expect(page).not.toHaveURL(new RegExp('/resources'));
      await expect(page).not.toHaveURL(new RegExp('/events'));
      await expect(detailsPage.getSectionHeader(sectionHeader)).toBeVisible();
    });
  });
});