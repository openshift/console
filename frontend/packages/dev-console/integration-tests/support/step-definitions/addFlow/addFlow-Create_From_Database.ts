import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { seelctCardFromOptions, catalogPageObj, catalogPage } from '../../pages/add_page';
import { addOptions } from '../../constants/add';
import { topologyPage } from '../../pages/topology_page';

When('user clicks Database card', () => {
  seelctCardFromOptions(addOptions.Database);
});

When('user selects {string} databse on Developer Catalog', (database: string) => {
  catalogPage.search(database);
  cy.byTestID('Template-mariadb-persistent').click();
});

When('clicks Instantiate Template button on side pane', () => {
  catalogPage.clickInstantiateButtonOnSidePane();
});

When('user clicks create button on Instantiate Template page with default values', () => {
  cy.get(catalogPageObj.create).click();
});

Then('created workload {string} is present in topology page', (workloadName: string) => {
  topologyPage.verifyWorkloadInTopologyPage(workloadName);
});
