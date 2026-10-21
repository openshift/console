import { addOptions } from '../../constants/add';
import { devNavigationMenu } from '../../constants/global';
import { addPage } from '../add-flow/add-page';
import { catalogPage } from '../add-flow/catalog-page';
import { navigateTo } from '../app';

export const createHelmRelease = (helmCardName: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.HelmChart);
  catalogPage.search(helmCardName);
  catalogPage.selectHelmChartCard(helmCardName);
  catalogPage.clickButtonOnCatalogPageSidePane();
  catalogPage.clickOnInstallButton();
};

export const createHelmReleaseWithName = (helmCardName: string, releaseName: string) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.HelmChart);
  catalogPage.search(helmCardName);
  catalogPage.selectHelmChartCard(helmCardName);
  catalogPage.clickButtonOnCatalogPageSidePane();
  catalogPage.enterReleaseName(releaseName);
  catalogPage.clickOnInstallButton();
};
