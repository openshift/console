import { Then, When } from 'cypress-cucumber-preprocessor/steps';

When('user click on Application button in Masthead', () => {
  cy.byLegacyTestID('application-launcher')
    .should('be.visible')
    .click();
});

Then('{string} entry is present in Application menu in Masthead', (entry: string) => {
  cy.byTestID('application-launcher-item')
    .find('.pf-c-app-launcher__menu-item-text')
    .should('have.text', entry);
});
