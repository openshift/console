import { When } from 'cypress-cucumber-preprocessor/steps';
import { catalogPage, sidePaneObj } from '@console/dev-console/integration-tests/support/pages';

When('user searches and selects {string} helm chart from catalog page', (helmChartName: string) => {
  catalogPage.search(helmChartName);
  catalogPage.selectHelmChartCard(helmChartName);
});

When('user will see the information of all the chart versions together', () => {
  sidePaneObj.verifyChartVersion();
});

When('user clicks on the Install Helm Chart button on side bar', () => {
  catalogPage.clickButtonOnCatalogPageSidePane();
});
