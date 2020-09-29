import { checkErrors } from '../../../../integration-tests-cypress/support';

before(() => {
  cy.login();
  cy.visit('');
});

after(() => {
  cy.logout();
});

afterEach(() => {
  checkErrors();
});
