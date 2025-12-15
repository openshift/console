import { nav } from '../views/nav';

declare global {
  namespace Cypress {
    interface Chainable {
      initAdmin(): Chainable<Element>;
      initDeveloper(): Chainable<Element>;
    }
  }
}

// any command added below, must be added to global Cypress interface above

Cypress.Commands.add('initAdmin', () => {
  cy.log('redirect to home');
  cy.visit('/');
  cy.byTestID('loading-indicator').should('not.exist');
  cy.log('ensure perspective switcher is set to Core platform');
  nav.sidenav.switcher.changePerspectiveTo('Core platform');
  nav.sidenav.switcher.shouldHaveText('Core platform');
});

Cypress.Commands.add('initDeveloper', () => {
  cy.log('redirect to home');
  cy.visit('/add');
  cy.byTestID('loading-indicator').should('not.exist');
  cy.document().its('readyState').should('eq', 'complete');
  cy.log('ensure perspective switcher is set to Developer');
  nav.sidenav.switcher.changePerspectiveTo('Developer');
  cy.log('switched perspective to Developer');
  nav.sidenav.switcher.shouldHaveText('Developer');
  cy.log('Developer perspective confirmed ');
});
