import { When } from 'cypress-cucumber-preprocessor/steps';
import { catalogPage, sidePaneObj } from '../../pages';

When('user clicks on the Install Helm Chart button on side bar', () => {
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user will see the information of all the chart versions together', () => {
  sidePaneObj.verifyChartVersion();
});
