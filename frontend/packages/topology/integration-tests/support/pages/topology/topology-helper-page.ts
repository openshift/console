import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { app } from '@console/dev-console/integration-tests/support/pages';

export const topologyHelper = {
  search: (name: string) =>
    cy
      .get(topologyPO.search)
      .clear()
      .type(name),
  verifyWorkloadInTopologyPage: (appName: string) => {
    topologyHelper.search(appName);
    cy.get(topologyPO.highlightNode).should('be.visible');
    app.waitForDocumentLoad();
  },
};
