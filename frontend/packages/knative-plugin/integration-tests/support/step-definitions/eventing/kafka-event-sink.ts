import { And } from 'cypress-cucumber-preprocessor/steps';

And('user selects sinks provided by Red Hat', () => {
  cy.get('[data-test="provider-red-hat"] input[type=checkbox]').click();
});

And('user switches to form view', () => {
  cy.byTestID('form-view-input')
    .should('be.visible')
    .click();
});

And('user creates a BootStrapServer as {string}', (serverName: string) => {
  cy.get('[aria-label="Bootstrap servers"]')
    .should('be.visible')
    .clear()
    .type(serverName)
    .type('{enter}');
});

And('user creates a Topic as {string}', (name: string) => {
  cy.byTestID('kafkasink-topic-field')
    .should('be.visible')
    .clear()
    .type(name);
});

And('user clicks on Create button for kafkasink form', () => {
  cy.get('[data-test-id="submit-button"]')
    .should('be.enabled')
    .click();
});
