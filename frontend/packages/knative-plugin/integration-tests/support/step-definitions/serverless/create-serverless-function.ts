import { Then } from 'cypress-cucumber-preprocessor/steps';
import { eventingPO } from '@console/knative-plugin/integration-tests/support/pageObjects/global-po';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';

Then('user clicks on Topology list view', () => {
  cy.get(topologyPO.quickSearchPO.listView).click();
});

Then(
  'user will see name of the serverless function as KSVC label followed by fx label and name {string}',
  (name: string) => {
    cy.get(`#${name}-app-Service`)
      .find(eventingPO.resourceIcon)
      .should('contain.text', 'KSVC');
    cy.get(`#${name}-app-Service`)
      .find('.odc-topology-list-view__type-icon')
      .should('have.attr', 'src')
      .should('include', 'static/assets/serverlessfx.svg');
    cy.get(`#${name}-app-Service`)
      .find('.pf-c-data-list__cell')
      .should('contain.text', name);
  },
);
