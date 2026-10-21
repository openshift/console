import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
import { perspective, topologyPage } from '@console/dev-console/integration-tests/support/pages';

export const topologyAdminPerspective = () => {
  perspective.switchTo(switchPerspective.Administrator);
  cy.get('[data-quickstart-id="qs-nav-workloads"]').should('be.visible').click({ force: true });
  cy.byLegacyTestID('topology-header').should('be.visible').click({ force: true });
  topologyPage.verifyTopologyPage();
};
