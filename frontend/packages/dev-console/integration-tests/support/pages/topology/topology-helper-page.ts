import { topologyPO } from '../../pageObjects/topology-po';

export const topologyHelper = {
  search: (name: string) =>
    cy
      .byLegacyTestID('item-filter')
      .clear()
      .type(name),
  verifyWorkloadInTopologyPage: (appName: string) => {
    topologyHelper.search(appName);
    cy.get(topologyPO.search).should('be.visible');
    cy.document()
      .its('readyState')
      .should('eq', 'complete');
  },
};
