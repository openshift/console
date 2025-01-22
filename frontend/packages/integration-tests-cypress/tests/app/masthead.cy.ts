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

  describe('Logo', () => {
    it('should be restricted to a max-height of 60px', () => {
      cy.byTestID('masthead-logo').should('be.visible');
      cy.byTestID('masthead-logo').should('have.css', 'max-height', '60px');
      cy.byTestID('masthead-logo').invoke('height').should('be.lte', 60);
    });
  });

  describe('Quick create', () => {
    it('should open Import YAML', () => {
      masthead.quickCreateDropdown().click();
      cy.byTestID('qc-import-yaml').should('be.visible');
      cy.get('[data-test="qc-import-yaml"] a').click({ force: true });
      cy.get('[data-test-id="resource-title"]').should('include.text', 'Import YAML');
    });
    it('should open Import from Git', () => {
      masthead.quickCreateDropdown().click();
      cy.byTestID('qc-import-from-git').should('be.visible');
      cy.get('[data-test="qc-import-from-git"] a').click({ force: true });
      cy.get('[data-test-id="resource-title"]').should('include.text', 'Import from Git');
    });
    it('should open Deploy Image', () => {
      masthead.quickCreateDropdown().click();
      cy.byTestID('qc-container-images').should('be.visible');
      cy.get('[data-test="qc-container-images"] a').click({ force: true });
      cy.get('[data-test-id="resource-title"]').should('include.text', 'Deploy Image');
    });
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
        cy.byTestID('user-dropdown-toggle').click();
        cy.byTestID('log-out').should('be.visible');
        cy.byTestID('log-out').click({ force: true });
        cy.visit('/');
      });
    });
  });
});
