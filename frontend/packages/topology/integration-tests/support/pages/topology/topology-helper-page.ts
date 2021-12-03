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
    // eslint-disable-next-line promise/catch-or-return
    cy.get('body').then(($body) => {
      if (
        $body.find('[data-test-id="topology-switcher-view"][aria-label="Graph view"]').length !== 0
      ) {
        cy.get(topologyPO.list.switcher).click();
        cy.log('user is switching to graph view in topology page');
      } else {
        cy.log('You are on Topology page - Graph view');
      }
    });
    cy.get(topologyPO.graph.reset).click();
    cy.get(topologyPO.highlightNode).should('be.visible');
    app.waitForDocumentLoad();
  },
  verifyWorkloadDeleted: (workloadName: string) => {
    topologyHelper.search(workloadName).should('not.be.visible');
  },
};
