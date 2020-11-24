import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { pageTitle } from '../constants/pageTitle';
import { addHealthChecksPO } from '../pageObjects/addHealthChecks-po';

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
    addHealthChecksPage.clickProbeLink('Add Readiness Probe');
    addHealthChecksPage.verifyHealthChecksForm();
    addHealthChecksPage.clickCheckIcon();
    addHealthChecksPage.verifySuccessText('Readiness Probe Added');
  },
  removeReadinessProbe: () => {
    cy.get(addHealthChecksPO.removeReadinessProbeIcon).click();
  },
  addLivenessProbe: () => {
    addHealthChecksPage.clickProbeLink('Add Liveness Probe');
    addHealthChecksPage.verifyHealthChecksForm();
    addHealthChecksPage.clickCheckIcon();
    addHealthChecksPage.verifySuccessText('Liveness Probe Added');
  },
  addStartupProbe: () => {
    addHealthChecksPage.clickProbeLink('Add Startup Probe');
    addHealthChecksPage.verifyHealthChecksForm();
    addHealthChecksPage.clickCheckIcon();
    addHealthChecksPage.verifySuccessText('Startup Probe Added');
  },
};
