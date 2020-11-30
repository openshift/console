import { catalogPage } from '../add-flow/catalog-page';
import { addPage } from '../add-flow/add-page';
import { addOptions } from '../../constants/add';
import { pageTitle } from '../../constants/pageTitle';
import { topologyPO } from '../../pageObjects/topology-po';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';

export const createHelmChartFromAddPage = (
  releaseName: string = 'nodejs-ex-k',
  helmChartName: string = 'Nodejs Ex K v0.2.1',
) => {
  addPage.verifyCard('Helm Chart');
  addPage.selectCardFromOptions(addOptions.HelmChart);
  detailsPage.titleShouldContain(pageTitle.DeveloperCatalog);
  catalogPage.isCardsDisplayed();
  catalogPage.search(helmChartName);
  catalogPage.selectHelmChartCard(helmChartName);
  catalogPage.verifyDialog();
  catalogPage.clickButtonOnCatalogPageSidePane();
  catalogPage.verifyInstallHelmChartPage();
  catalogPage.enterReleaseName(releaseName);
  catalogPage.clickOnInstallButton();
  cy.get(topologyPO.switcher).click();
  cy.byLegacyTestID('item-filter')
    .clear()
    .type(releaseName);
  cy.get('div.is-filtered').should('be.visible');
  cy.get(topologyPO.switcher).click();
};
