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
  upgradeChartVersion: () => {
    cy.get(helmPO.upgradeHelmRelease.chartVersion).click();
    const count = Cypress.$('[data-test-id="dropdown-menu"]').length;
    const randNum = Math.floor(Math.random() * count);
    cy.byLegacyTestID('dropdown-menu')
      .eq(randNum)
      .click();
    cy.get('body').then(($body) => {
      if ($body.find('form.modal-content').length) {
        cy.log('Change Chart version popup is displayed, so clicking on the proceed button');
        cy.get('form.modal-content').within(() => {
          cy.byLegacyTestID('modal-title').should('contain.text', 'Change chart version?');
          cy.get('button[type=submit]').click({ force: true });
        });
      }
    });
  },
  clickOnUpgrade: () => {
    cy.get(helmPO.upgradeHelmRelease.upgrade).click();
  },
};
