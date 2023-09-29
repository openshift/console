import { checkErrors } from '../../support';
import { isLocalDevEnvironment } from '../../views/common';
import { masthead } from '../../views/masthead';

describe('Masthead', () => {
  before(() => {
    // clear any existing sessions
    Cypress.session.clearAllSavedSessions();
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit('/');
  });

  describe('User dropdown', () => {
    it('should render the correct copy login command link', () => {
      cy.window().then((win: any) => {
        if (win.SERVER_FLAGS?.authDisabled) {
          cy.log('Skipping test, auth is disabled');
        } else {
          masthead.userDropdown().click();
          masthead.copyLoginCommand().should('be.visible').invoke('removeAttr', 'target');
          masthead.copyLoginCommand().click();
          if (isLocalDevEnvironment) {
            cy.origin(Cypress.env('OAUTH_BASE_ADDRESS'), () => {
              // note required duplication in else below due to limitations of cy.origin
              cy.url().should('include', '/oauth/token/display');
              cy.get('body').should('include.text', 'Display Token');
            });
          } else {
            // note required duplication in if above due to limitations of cy.origin
            cy.url().should('include', '/oauth/token/display');
            cy.get('body').should('include.text', 'Display Token');
          }
          cy.visit('/');
        }
      });
    });
    it('should log the user out', () => {
      // Check if auth is disabled (for a local development environment).
      cy.window().then((win: any) => {
        if (win.SERVER_FLAGS?.authDisabled) {
          cy.task('log', '  skipping logout, console is running with auth disabled');
          return;
        }
        cy.task('log', '  Logging out');
        cy.byTestID('user-dropdown').click();
        cy.byTestID('log-out').should('be.visible');
        cy.byTestID('log-out').click({ force: true });
        cy.visit('/');
      });
    });
  });
});
