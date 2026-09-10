import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { switchPerspective } from '../../constants';
import { helpDropdownMenu } from '../../pageObjects';
import { perspective } from '../../pages';

Given('user is at admin perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

When('user selects QuickStarts from the help menu icon on the masthead', () => {
  cy.initDeveloper();
  cy.get(helpDropdownMenu).should('be.visible').click();
  cy.get('[data-test="masthead-quick-starts"]')
    .should('be.visible')
    .contains(/Quick Starts/i)
    .click();
});
