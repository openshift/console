import { When, Then } from 'cypress-cucumber-preprocessor/steps';

Then('user will see {string}', (tableColumn: string) => {
  cy.get(`[data-label="${tableColumn}"]`).should('be.visible');
});

Then('user will see {string} Build details page', (build: string) => {
  cy.get('[data-test-id="resource-title"]').should('contain', build);
});

When('user clicks on last run of {string} build', (build: string) => {
  cy.get(`[data-test-id^="${build}-"]`).click();
});

Then('user will see {string} BuildRun details page', (build: string) => {
  cy.get('[data-test-id="resource-title"]').should('contain', build);
});
