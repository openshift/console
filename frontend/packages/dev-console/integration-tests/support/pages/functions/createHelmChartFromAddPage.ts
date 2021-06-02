import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, pageTitle } from '../../constants';
import { catalogPage, addPage } from '../add-flow';

export const createHelmChartFromAddPage = (
  releaseName: string = 'nodejs-ex-k',
  helmChartName: string = 'Nodejs Ex K v0.2.1',
) => {
  addPage.verifyCard('Helm Chart');
  addPage.selectCardFromOptions(addOptions.HelmChart);
  detailsPage.titleShouldContain(pageTitle.HelmCharts);
  catalogPage.isCardsDisplayed();
  catalogPage.search(helmChartName);
  catalogPage.selectHelmChartCard(helmChartName);
  catalogPage.verifyDialog();
  catalogPage.clickButtonOnCatalogPageSidePane();
  catalogPage.verifyInstallHelmChartPage();
  catalogPage.enterReleaseName(releaseName);
  catalogPage.clickOnInstallButton();
};
