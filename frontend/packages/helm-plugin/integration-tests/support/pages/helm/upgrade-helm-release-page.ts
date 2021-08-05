import { modal } from '@console/cypress-integration-tests/views/modal';
import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects/helm-po';

export const upgradeHelmRelease = {
  verifyTitle: () =>
    cy
      .get('h1')
      .contains('Upgrade Helm Release')
      .should('be.visible'),
  updateReplicaCount: (replicaCount: string = '2') =>
    cy
      .get(helmPO.upgradeHelmRelease.replicaCount)
      .clear()
      .type(replicaCount),
  upgradeChartVersion: (yamlView: boolean = false) => {
    cy.get(helmPO.upgradeHelmRelease.chartVersion).click();
    const count = Cypress.$('[data-test-id="dropdown-menu"]').length;
    const randNum = Math.floor(Math.random() * count);
    cy.byLegacyTestID('dropdown-menu')
      .eq(randNum)
      .click();
    if (yamlView === true) {
      modal.modalTitleShouldContain('Change Chart Version?');
      modal.submit();
    }
  },
  clickOnUpgrade: () => {
    cy.get(helmPO.upgradeHelmRelease.upgrade).click();
  },
};
