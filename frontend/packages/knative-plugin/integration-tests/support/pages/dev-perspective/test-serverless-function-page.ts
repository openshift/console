import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { app } from '@console/dev-console/integration-tests/support/pages';

export const reloadPageUntilWorkloadIsDisplayed = (
  workloadName: string,
  maxAttempts = 15,
  attempts = 0,
) => {
  if (attempts > maxAttempts) {
    throw new Error('Timed out waiting for Workload to be displayed');
  }
  app.waitForDocumentLoad();
  cy.get('[aria-label="Topology List View"]', { timeout: 15000 }).should('be.visible');
  cy.get('body').then(($el) => {
    if (!$el.find(`[aria-label="${workloadName} sub-resources"]`).is(':visible')) {
      cy.reload();
      app.waitForLoad();
      guidedTour.close();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(5000);
      reloadPageUntilWorkloadIsDisplayed(workloadName, maxAttempts, attempts + 1);
    }
  });
};
