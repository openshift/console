import { devNavigationMenu } from '../../constants/global';
import { navigateTo } from '../app';
import { addOptions } from '../../constants/add';
import { catalogPage } from '../add-flow/catalog-page';
import { addPage } from '../add-flow/add-page';

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
