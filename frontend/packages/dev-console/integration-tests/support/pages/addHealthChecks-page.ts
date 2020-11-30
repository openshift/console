import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';

export const addHealthChecksPage = {
  verifyTitle: () => detailsPage.titleShouldContain('Add Health Checks'),
  clickCheckIcon: () => cy.byLegacyTestID('check-icon').click(),
  clickCancelIcon: () => cy.byLegacyTestID('close-icon').click(),
  addReadinessProbe: () => {
    cy.byButtonText('Add Readiness Probe').click();
    cy.get('div.odc-heath-check-probe-form').should('be.visible');
    addHealthChecksPage.clickCheckIcon();
    cy.get('span.odc-heath-check-probe__successText')
      .contains('Readiness Probe Added')
      .should('be.visible');
  },
  addLivenessProbe: () => {
    cy.byButtonText('Add Liveness Probe')
      .scrollIntoView()
      .click();
    cy.get('div.odc-heath-check-probe-form').should('be.visible');
    addHealthChecksPage.clickCheckIcon();
    cy.get('span.odc-heath-check-probe__successText')
      .contains('Liveness Probe Added')
      .should('be.visible');
  },
  addStartupProbe: () => {
    cy.byButtonText('Add Startup Probe')
      .scrollIntoView()
      .click();
    cy.get('div.odc-heath-check-probe-form').should('be.visible');
    addHealthChecksPage.clickCheckIcon();
    cy.get('span.odc-heath-check-probe__successText')
      .contains('Startup Probe Added')
      .should('be.visible');
  },
};
