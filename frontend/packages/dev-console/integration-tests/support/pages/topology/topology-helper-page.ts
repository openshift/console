import { topologyPO } from '../../pageObjects/topology-po';
import { app } from '../app';

export const topologyHelper = {
  search: (name: string) =>
    cy
      .get(topologyPO.search)
      .clear()
      .type(name),
  verifyWorkloadInTopologyPage: (appName: string) => {
    topologyHelper.search(appName);
    cy.get(topologyPO.highlightNode).should('be.visible');
    app.waitForDocumentLoaded();
  },
};
