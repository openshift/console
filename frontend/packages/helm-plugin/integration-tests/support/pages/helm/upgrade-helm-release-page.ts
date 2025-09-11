import { warningModal } from '@console/cypress-integration-tests/views/warning-modal';
import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects/helm-po';

export const upgradeHelmRelease = {
  verifyTitle: () => cy.get('h1').contains('Upgrade Helm Release').should('be.visible'),
  updateReplicaCount: (replicaCount: string = '2') =>
    cy.get(helmPO.upgradeHelmRelease.replicaCount).clear().type(replicaCount),
  upgradeChartVersion: () => {
    cy.get(helmPO.upgradeHelmRelease.chartVersion).click();
    const count = Cypress.$('[data-test="console-select"]').length;
    const randNum = Math.floor(Math.random() * count);
    cy.byTestID('console-select-item').eq(randNum).click();
    warningModal.confirm('HelmChangeChartVersionConfirmation');
  },
  clickOnUpgrade: () => {
    cy.get(helmPO.upgradeHelmRelease.upgrade).click();
  },
};
