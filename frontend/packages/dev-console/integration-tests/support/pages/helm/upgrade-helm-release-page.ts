import { helmPO } from '../../pageObjects/helm-po';
import { modal } from '../../../../../integration-tests-cypress/views/modal';

export const upgradeHelmRelease = {
  verifyTitle: () =>
    cy
      .get('h1')
      .contains('Upgrade Helm Release')
      .should('be.visible'),
  updateReplicaCount: () =>
    cy
      .get(helmPO.upgradeHelmRelease.replicaCount)
      .clear()
      .type('2'),
  upgradeChartVersion: (yamlView: boolean = false) => {
    cy.get(helmPO.upgradeHelmRelease.chartVersion).click();
    cy.byLegacyTestID('dropdown-menu').then((listing) => {
      const count = Cypress.$(listing).length;
      const randNum = Math.floor(Math.random() * count);
      cy.byLegacyTestID('dropdown-menu')
        .eq(randNum)
        .click();
    });
    if (yamlView === true) {
      modal.modalTitleShouldContain('Change Chart Version?');
      cy.byTestID('confirm-action').click();
    }
  },
  clickOnUpgrade: () => {
    cy.get(helmPO.upgradeHelmRelease.upgrade).click();
  },
};
