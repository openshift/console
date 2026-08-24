import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '@console/cypress-integration-tests/views/nav';
import { switchPerspective } from '../../constants';
import { customizationPO } from '../../pageObjects/customization';
import { adminNavigationMenuPO } from '../../pageObjects/global-po';
import { app, perspective } from '../../pages';

Given('user is at admin perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

Given('user is at Search page in Home section', () => {
  cy.get(adminNavigationMenuPO.home.main).should('be.visible').click();
  cy.get(adminNavigationMenuPO.home.search).should('be.visible').click();
  app.waitForLoad();
});

When('user searches {string}', (searchTerm: string) => {
  cy.get(customizationPO.resourceSearch).should('be.visible').click();
  cy.get(customizationPO.resourceSearch).type(searchTerm);
  cy.get(customizationPO.filter).should('be.visible').click();
  cy.get(customizationPO.consoleItems).should('be.visible').click();
});

When('user clicks on cluster', () => {
  cy.byTestID('cluster').should('be.visible').click();
});

When('user clicks the {string} button in the page heading', (buttonText: string) => {
  cy.get('[data-test="page-heading"]')
    .find('button')
    .contains(buttonText)
    .should('be.visible')
    .click();
  app.waitForLoad();
});

When(
  'user selects {string} in the Developer under perspective section of general customisation',
  (visibilityState: string) => {
    cy.contains('Perspectives').should('be.visible');
    cy.contains('Developer').should('be.visible');
    cy.get('body').then(($body) => {
      // Find the Developer perspective row and select the visibility state
      const developerRow = $body.find(':contains("Developer")').last();
      cy.wrap(developerRow)
        .parent()
        .find('select, [role="listbox"]')
        .then(($select) => {
          if ($select.is('select')) {
            cy.wrap($select).select(visibilityState);
          } else {
            cy.wrap($select).click();
            cy.contains('[role="option"]', visibilityState).click();
          }
        });
    });
  },
);

Then('user will see Saved alert', () => {
  cy.get(customizationPO.successAlert).should('be.visible');
});

Then('user refreshes the page to see developer option', () => {
  cy.reload();
  app.waitForLoad();
});

Then('user will see developer perspective in the perspective switcher', () => {
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Developer);
});
