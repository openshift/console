import { topologyPO } from '../../pageObjects/topology-po';

export const topologyHelper = {
  search: (name: string) =>
    cy
      .get(topologyPO.search)
      .clear()
      .type(name),
  verifyWorkloadInTopologyPage: (appName: string) => {
    topologyHelper.search(appName);
    cy.get(topologyPO.highlightNode).should('be.visible');
    cy.document()
      .its('readyState')
      .should('eq', 'complete');
  },
};
