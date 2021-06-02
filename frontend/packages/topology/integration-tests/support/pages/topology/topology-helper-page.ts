import { app } from '@console/dev-console/integration-tests/support/pages';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';

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
  verifyWorkloadDeleted: (workloadName: string) => {
    topologyHelper.search(workloadName).should('not.be.visible');
  },
};
