import { checkErrors } from '../../support';
import { masthead } from '../../views/masthead';

describe('Masthead', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit('/');
    cy.logout();
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
          cy.url().should('include', '/oauth/token/display');
          cy.get('body').should('include.text', 'Display Token');
        }
      });
    });
    // TODO: Add more tests for user dropdown
  });
  // TODO Add more tests for masthead
});
