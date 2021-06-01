import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { pageTitle } from '../constants';
import { addHealthChecksPO } from '../pageObjects';

export const addHealthChecksPage = {
  verifyTitle: () => detailsPage.titleShouldContain(pageTitle.AddHealthChecks),
  clickCheckIcon: () => cy.byLegacyTestID('check-icon').click(),
  clickCancelIcon: () => cy.byLegacyTestID('close-icon').click(),
  clickAdd: () => cy.get(addHealthChecksPO.add).click(),
  clickSave: () => cy.get(addHealthChecksPO.save).click(),
  verifyHealthChecksForm: () => cy.get(addHealthChecksPO.healthChecksForm).should('be.visible'),
  verifySuccessText: (text: string) =>
    cy
      .get(addHealthChecksPO.successText)
      .contains(text)
      .should('be.visible'),
  clickProbeLink: (probeName: string) =>
    cy
      .byButtonText(probeName)
      .scrollIntoView()
      .click(),
  addReadinessProbe: () => {
    addHealthChecksPage.clickProbeLink('Add Readiness probe');
    addHealthChecksPage.verifyHealthChecksForm();
    addHealthChecksPage.clickCheckIcon();
    addHealthChecksPage.verifySuccessText('Readiness probe added');
  },
  removeReadinessProbe: () => {
    cy.get(addHealthChecksPO.removeReadinessProbeIcon).click();
  },
  addLivenessProbe: () => {
    cy.byButtonText('Add Liveness probe')
      .scrollIntoView()
      .click();
    cy.get('div.odc-heath-check-probe-form').should('be.visible');
    addHealthChecksPage.clickCheckIcon();
    addHealthChecksPage.verifySuccessText('Liveness probe added');
  },
  addStartupProbe: () => {
    cy.byButtonText('Add Startup probe')
      .scrollIntoView()
      .click();
    cy.get('div.odc-heath-check-probe-form').should('be.visible');
    addHealthChecksPage.clickCheckIcon();
    addHealthChecksPage.verifySuccessText('Startup probe added');
  },
};
