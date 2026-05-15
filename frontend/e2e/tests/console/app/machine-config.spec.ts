import { test, expect } from '../../../fixtures';
import { DetailsPage } from '../../../pages/details-page';
import { MachineConfigPage } from '../../../pages/machine-config-page';

const MC_WITH_CONFIG_FILES = '00-master';
const MC_WITHOUT_CONFIG_FILES = '99-master-ssh';
const MC_DETAILS_PAGE_URL = '/k8s/cluster/machineconfiguration.openshift.io~v1~MachineConfig/';
const MC_SECTION_HEADING = 'Configuration files';

test.describe('MachineConfig resource details page', () => {
  test(`${MC_WITH_CONFIG_FILES} displays configuration files`, async ({ page, k8sClient }) => {
    const detailsPage = new DetailsPage(page);
    const mcPage = new MachineConfigPage(page);

    await page.goto(`${MC_DETAILS_PAGE_URL}${MC_WITH_CONFIG_FILES}`);
    await detailsPage.isLoaded();
    await detailsPage.titleShouldContain(MC_WITH_CONFIG_FILES);

    await expect(mcPage.sectionHeading(MC_SECTION_HEADING)).toBeVisible();
    await expect(mcPage.configFilePath).toBeVisible();
    await expect(mcPage.copyToClipboard.first()).toBeVisible();

    const mcResource: any = await k8sClient.customObjectsApi.getClusterCustomObject({
      group: 'machineconfiguration.openshift.io',
      version: 'v1',
      plural: 'machineconfigs',
      name: MC_WITH_CONFIG_FILES,
    });
    const fileEntry = mcResource?.spec?.config?.storage?.files?.[0];
    expect(fileEntry).toHaveProperty('contents');
    expect(fileEntry).toHaveProperty('mode');
    expect(fileEntry).toHaveProperty('overwrite');
    const {
      contents: { source },
      mode,
      overwrite,
    } = fileEntry;
    await mcPage.checkConfigFileDetails(mode, overwrite, source);
  });

  test(`${MC_WITHOUT_CONFIG_FILES} does not display configuration files`, async ({ page }) => {
    const detailsPage = new DetailsPage(page);
    const mcPage = new MachineConfigPage(page);

    await page.goto(`${MC_DETAILS_PAGE_URL}${MC_WITHOUT_CONFIG_FILES}`);
    await detailsPage.isLoaded();
    await detailsPage.titleShouldContain(MC_WITHOUT_CONFIG_FILES);

    await expect(mcPage.sectionHeading(MC_SECTION_HEADING)).toBeHidden();
    await expect(mcPage.configFilePath).toBeHidden();
    await expect(mcPage.copyToClipboard).toHaveCount(0);
  });
});
