import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
import { perspective, topologyPage } from '@console/dev-console/integration-tests/support/pages';

export const topologyAdminPerspective = () => {
  perspective.switchTo(switchPerspective.Administrator);
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
  topologyPage.verifyTopologyPage();
};
