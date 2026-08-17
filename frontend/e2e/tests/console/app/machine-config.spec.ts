import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { retryOnModelNotFound } from '../../../utils/retry-model-error';

const MC_WITH_CONFIG_FILES = '00-master';
const MC_WITHOUT_CONFIG_FILES = '99-master-ssh';
const MC_DETAILS_PAGE_URL = '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig/';
const MC_SECTION_HEADING = 'section-heading-Configuration files';

test.describe('MachineConfig resource details page', () => {
  test(`${MC_WITH_CONFIG_FILES} displays configuration files`, async ({ page, k8sClient }) => {
    const detailsPage = new DetailsPage(page);

    await detailsPage.navigateToDetailsPage(`${MC_DETAILS_PAGE_URL}${MC_WITH_CONFIG_FILES}`);
    await detailsPage.waitForPageLoad();
    await retryOnModelNotFound(page);
    await expect(detailsPage.title).toContainText(MC_WITH_CONFIG_FILES, { timeout: 30_000 });
    await expect(page.getByTestId(MC_SECTION_HEADING)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('config-file-path-0')).toBeVisible();
    await expect(page.locator('.co-copy-to-clipboard__text').first()).toBeVisible();

    const mc = (await k8sClient.getClusterCustomResource(
      'machineconfiguration.openshift.io',
      'v1',
      'machineconfigs',
      MC_WITH_CONFIG_FILES,
    )) as { spec?: { config?: { storage?: { files?: Array<{ contents?: { source?: string }; mode?: number; overwrite?: boolean }> } } } };

    const file = mc.spec?.config?.storage?.files?.[0];
    expect(file).toBeDefined();
    expect(file?.contents).toBeDefined();
    expect(file?.mode).toBeDefined();
    expect(file?.overwrite).toBeDefined();

    await page.getByTestId('config-file-path-0').scrollIntoViewIfNeeded();
    await page.locator('button[aria-label="Info"]').first().click();

    const descriptionList = page.locator('[class*="description-list"]');
    await expect(descriptionList.getByText(String(file!.mode), { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      descriptionList.getByText(String(file!.overwrite), { exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    const decodedContent = decodeURIComponent(file!.contents!.source!)
      .replace(/^(data:,)/, '')
      .slice(0, 30);
    await expect(page.locator('code').first()).toContainText(decodedContent, { timeout: 10_000 });
  });

  test(`${MC_WITHOUT_CONFIG_FILES} does not display configuration files`, async ({ page }) => {
    const detailsPage = new DetailsPage(page);

    await detailsPage.navigateToDetailsPage(`${MC_DETAILS_PAGE_URL}${MC_WITHOUT_CONFIG_FILES}`);
    await detailsPage.waitForPageLoad();
    await retryOnModelNotFound(page);
    await expect(detailsPage.title).toContainText(MC_WITHOUT_CONFIG_FILES, { timeout: 30_000 });
    await expect(page.getByTestId(MC_SECTION_HEADING)).not.toBeAttached();
    await expect(page.getByTestId('config-file-path-0')).not.toBeAttached();
    await expect(page.locator('.co-copy-to-clipboard__text')).not.toBeAttached();
  });
});
