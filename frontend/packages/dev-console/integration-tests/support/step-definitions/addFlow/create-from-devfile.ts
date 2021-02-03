import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add-flow/add-page';
import { addOptions } from '../../constants/add';
import { topologyPO } from '../../pageObjects/topology-po';

Given('user is at Import from Devfile page', () => {
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  addPage.selectCardFromOptions(addOptions.DevFile);
});

When('user right clicks on topology empty graph', () => {
  cy.get(topologyPO.switcher).click({ force: true });
  cy.get(topologyPO.graph.emptyGraph).trigger('contextmenu', { force: true });
});

When('user selects {string} option from Add to Project context menu', (option: string) => {
  cy.get(topologyPO.graph.contextMenuOptions.addToProject).trigger('mouseover');
  cy.byTestActionID(option).click({ force: true });
});
