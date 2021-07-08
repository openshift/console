import 'cypress-file-upload';

import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { infoMessage } from '../../views/form';
import { listPage } from '../../views/list-page';
import { nav } from '../../views/nav';
import { secrets } from '../../views/secret';

const populateSecretForm = (name: string, key: string, fileName: string) => {
  cy.get('.co-m-pane__heading').contains('Create key/value secret');
  cy.byTestID('secret-name').should('exist');
  cy.byLegacyTestID('file-input-textarea').should('exist');
  cy.byTestID('secret-name').type(name);
  cy.byTestID('secret-key').type(key);
  cy.byTestID('file-input').attachFile(fileName);
};

describe('Create key/value secrets', () => {
  const binarySecretName = `${testName}binarysecretname`;
  const asciiSecretName = `${testName}asciisecretname`;
  const unicodeSecretName = `${testName}unicodesecretname`;
  const binaryFilename = 'binarysecret.bin';
  const asciiFilename = 'asciisecret.txt';
  const unicodeFilename = 'unicodesecret.utf8';
  const secretKey = `secretkey`;

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
    secrets.clickCreateKeyValSecretDropdownButton();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`Validate a key/value secret whose value is a binary file `, () => {
    populateSecretForm(binarySecretName, secretKey, binaryFilename);
    cy.byLegacyTestID('file-input-textarea').should('not.exist');
    cy.get(infoMessage).should('exist');
    cy.byTestID('save-changes').click();
    detailsPage.isLoaded();
    cy.exec(
      `oc get secret -n ${testName} ${binarySecretName} --template '{{.data.${secretKey}}}' | base64 -d`,
      {
        failOnNonZeroExit: false,
      },
    ).then((value) => {
      cy.fixture(binaryFilename, 'binary').then((binarySecret) => {
        expect(binarySecret).toEqual(value.stdout);
      });
    });
  });

  it(`Validate a key/value secret whose value is an ascii file `, () => {
    populateSecretForm(asciiSecretName, secretKey, asciiFilename);
    cy.byLegacyTestID('file-input-textarea').should('exist');
    cy.get(infoMessage).should('not.exist');
    cy.byTestID('save-changes').click();
    detailsPage.isLoaded();
    cy.exec(
      `oc get secret -n ${testName} ${asciiSecretName} --template '{{.data.${secretKey}}}' | base64 -d`,
      {
        failOnNonZeroExit: false,
      },
    ).then((value) => {
      cy.fixture(asciiFilename, 'ascii').then((asciiSecret) => {
        expect(asciiSecret).toEqual(value.stdout);
      });
    });
  });

  it(`Validate a key/value secret whose value is a unicode file `, () => {
    populateSecretForm(unicodeSecretName, secretKey, unicodeFilename);
    cy.byLegacyTestID('file-input-textarea').should('exist');
    cy.get(infoMessage).should('not.exist');
    cy.byTestID('save-changes').click();
    detailsPage.isLoaded();
    cy.exec(
      `oc get secret -n ${testName} ${unicodeSecretName} --template '{{.data.${secretKey}}}' | base64 -d`,
      {
        failOnNonZeroExit: false,
      },
    ).then((value) => {
      cy.fixture(unicodeFilename, 'utf8').then((unicodeSecret) => {
        expect(unicodeSecret).toEqual(value.stdout);
      });
    });
  });
});
