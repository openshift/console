import { test, expect } from '../../fixtures';
import { DetailsPage } from '../../pages/details-page';
import { YamlEditorPage } from '../../pages/yaml-editor-page';

test.describe('packageserver PackageManifest tabs rendering', { tag: ['@admin'] }, () => {
  const csvNamespace = 'openshift-operator-lifecycle-manager';
  const csvName = 'packageserver';
  const sectionHeader = 'PackageManifest overview';
  let packageManifestName: string;
  let baseUrl: string;

  test.beforeAll(async ({ k8sClient }) => {
    const packageManifests = (await k8sClient.listCustomResources(
      'packages.operators.coreos.com',
      'v1',
      csvNamespace,
      'packagemanifests',
    )) as Array<{ metadata?: { name?: string } }>;

    packageManifestName = packageManifests.find((manifest) => manifest.metadata?.name)?.metadata?.name ?? '';
    if (!packageManifestName) {
      throw new Error(`No PackageManifest resources found in namespace ${csvNamespace}`);
    }

    baseUrl = `/k8s/ns/${csvNamespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/${csvName}/packages.operators.coreos.com~v1~PackageManifest/${packageManifestName}`;
  });

  test('renders Details tab correctly', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to PackageManifest Details tab', async () => {
      await detailsPage.navigateToDetailsUrl(baseUrl);
    });

    await test.step('Verify page title shows package name', async () => {
      await expect(detailsPage.title).toContainText(packageManifestName);
    });

    await test.step('Verify Details section header exists', async () => {
      await expect(detailsPage.getSectionHeader(sectionHeader)).toBeVisible();
    });
  });

  test('renders YAML tab correctly', async ({ page }) => {
    const yamlEditor = new YamlEditorPage(page);

    await test.step('Navigate to PackageManifest YAML tab', async () => {
      await yamlEditor.navigateToYamlUrl(`${baseUrl}/yaml`);
    });

    await test.step('Verify YAML contains package manifest metadata', async () => {
      const content = await yamlEditor.getEditorContent();
      expect(content).toContain(packageManifestName);
      expect(content).toContain('PackageManifest');
    });
  });

  test('renders Resources tab correctly', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to PackageManifest Resources tab', async () => {
      await detailsPage.navigateToDetailsUrl(`${baseUrl}/resources`);
    });

    await test.step('Verify resource list is empty', async () => {
      await expect(detailsPage.getEmptyState()).toBeVisible();
    });
  });

  test('renders Events tab correctly', async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await test.step('Navigate to PackageManifest Events tab', async () => {
      await detailsPage.navigateToDetailsUrl(`${baseUrl}/events`);
    });

    await test.step('Verify events stream component is empty', async () => {
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