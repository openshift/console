import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { app } from '@console/dev-console/integration-tests/support/pages';
import { buildPO } from '../support/pageObjects/build-po';

export const buildsPage = {
  clickOnCreateShipwrightBuild: () => {
    detailsPage.titleShouldContain('Builds');
    app.waitForLoad();
    cy.get('button');
    cy.get('body').then(() => {
      cy.contains(`[data-test-id="dropdown-button"]`, 'Create').click();
      cy.get(buildPO.shipwrightBuild.createShipwrightBuild).click();
    });
  },
};
