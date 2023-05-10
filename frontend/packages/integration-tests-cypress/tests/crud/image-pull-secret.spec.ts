import { checkErrors, testName } from '../../support';
import { listPage } from '../../views/list-page';
import { nav } from '../../views/nav';

const clickCreateImagePullSecretDropdownButton = () => {
  cy.byTestID('item-create')
    .click()
    .get('body')
    .then(($body) => {
      if ($body.find(`[data-test-dropdown-menu="image"]`).length) {
        cy.get(`[data-test-dropdown-menu="image"]`).click();
      }
    });
};

const typeValue = (testId: string, inputValue: string) => {
  cy.byTestID(testId).type(inputValue);
};

const populateImageSecretForm = (
  name: string,
  address: string,
  username: string,
  password: string,
  email: string,
) => {
  cy.get('.co-m-pane__heading').contains('Create image pull secret');
  cy.byTestID('secret-name').should('exist');
  typeValue('secret-name', name);
  typeValue('image-secret-address', address);
  typeValue('image-secret-username', username);
  typeValue('image-secret-password', password);
  cy.byTestID('image-secret-email').type(email).blur();
};

const isWhitespaceRemoved = (testId: string, expectedValue: string) => {
  cy.byTestID(testId).invoke('val').should('have.length', expectedValue.length);
};

describe('Create image pull secret', () => {
  const secretName = `${testName}-image-pull-secret-test`;
  const rsAddress = 'docker.io';
  const username = 'testUser51';
  const password = 'test1234';
  const email = 'testEmail@email.com';
  const padRsAddress = ' '.repeat(4) + rsAddress + ' '.repeat(4);
  const padUsername = ' '.repeat(3) + username + ' '.repeat(3);
  const padPassword = ' '.repeat(2) + password + ' '.repeat(2);
  const padEmail = ' '.repeat(1) + email + ' '.repeat(1);

  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  beforeEach(() => {
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    listPage.titleShouldHaveText('Secrets');
    clickCreateImagePullSecretDropdownButton();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`Validate a image pull secret whose input values contained whitespace`, () => {
    populateImageSecretForm(secretName, padRsAddress, padUsername, padPassword, padEmail);
    isWhitespaceRemoved('image-secret-address', rsAddress);
    isWhitespaceRemoved('image-secret-username', username);
    isWhitespaceRemoved('image-secret-password', password);
    isWhitespaceRemoved('image-secret-email', email);
    cy.byTestID('save-changes').click();
  });
});
