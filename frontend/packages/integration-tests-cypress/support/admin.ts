import { guidedTour } from '../views/guided-tour';
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
  cy.log('ensure perspective switcher is set to Administrator');
  nav.sidenav.switcher.changePerspectiveTo('Administrator');
  nav.sidenav.switcher.shouldHaveText('Administrator');
});

Cypress.Commands.add('initDeveloper', () => {
  cy.log('redirect to home');
  cy.visit('/add');
  cy.byTestID('loading-indicator').should('not.exist');
  cy.log('ensure perspective switcher is set to Developer');
  nav.sidenav.switcher.changePerspectiveTo('Developer');
  nav.sidenav.switcher.shouldHaveText('Developer');
  guidedTour.close();
});
