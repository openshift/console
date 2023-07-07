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

const modifySecretForm = (key: string) => {
  detailsPage.clickPageActionFromDropdown('Edit Secret');
  cy.get('.co-m-pane__heading').contains('Edit key/value secret');
  cy.byTestID('secret-key').clear().type(key);
};

describe('Create key/value secrets', () => {
  const binarySecretName = `${testName}binarysecretname`;
  const asciiSecretName = `${testName}asciisecretname`;
  const unicodeSecretName = `${testName}unicodesecretname`;
  const binaryFilename = 'binarysecret.bin';
  const asciiFilename = 'asciisecret.txt';
  const unicodeFilename = 'unicodesecret.utf8';
  const secretKey = `secretkey`;
  const modifiedSecretKey = 'modifiedsecretkey';

  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  beforeEach(() => {
    // ensure the test project is selected to avoid flakes
    cy.visit(`/k8s/cluster/projects/${testName}`);
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    listPage.titleShouldHaveText('Secrets');
    secrets.clickCreateKeyValSecretDropdownButton();
  });

  afterEach(() => {
    cy.exec(
      `oc delete secret -n ${testName} ${binarySecretName} ${asciiSecretName} ${unicodeSecretName}`,
      {
        failOnNonZeroExit: false,
      },
    );
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`Validate create and edit of a key/value secret whose value is a binary file`, () => {
    populateSecretForm(binarySecretName, secretKey, binaryFilename);
    cy.byLegacyTestID('file-input-textarea').should('not.exist');
    cy.get(infoMessage).should('exist');
    cy.byTestID('save-changes').click();
    cy.byTestID('loading-indicator').should('not.exist');
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(binarySecretName);
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
    modifySecretForm(modifiedSecretKey);
    cy.byTestID('save-changes').click();
    cy.byTestID('loading-indicator').should('not.exist');
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(binarySecretName);
    cy.exec(
      `oc get secret -n ${testName} ${binarySecretName} --template '{{.data.${modifiedSecretKey}}}' | base64 -d`,
      {
        failOnNonZeroExit: false,
      },
    ).then((value) => {
      cy.fixture(binaryFilename, 'binary').then((binarySecret) => {
        expect(binarySecret).toEqual(value.stdout);
      });
    });
  });

  it(`Validate a key/value secret whose value is an ascii file`, () => {
    populateSecretForm(asciiSecretName, secretKey, asciiFilename);
    cy.fixture(asciiFilename, 'ascii').then((asciiSecret) => {
      cy.byLegacyTestID('file-input-textarea').should('contain.text', asciiSecret);
      cy.get(infoMessage).should('not.exist');
      cy.byTestID('save-changes').click();
      cy.byTestID('loading-indicator').should('not.exist');
      detailsPage.isLoaded();
      detailsPage.titleShouldContain(asciiSecretName);
      cy.exec(
        `oc get secret -n ${testName} ${asciiSecretName} --template '{{.data.${secretKey}}}' | base64 -d`,
        {
          failOnNonZeroExit: false,
        },
      ).then((value) => {
        expect(asciiSecret).toEqual(value.stdout);
      });
    });
  });

  it(`Validate a key/value secret whose value is a unicode file`, () => {
    populateSecretForm(unicodeSecretName, secretKey, unicodeFilename);
    cy.fixture(unicodeFilename, 'utf8').then((unicodeSecret) => {
      cy.byLegacyTestID('file-input-textarea').should('contain.text', unicodeSecret);
      cy.get(infoMessage).should('not.exist');
      cy.byTestID('save-changes').click();
      cy.byTestID('loading-indicator').should('not.exist');
      detailsPage.isLoaded();
      detailsPage.titleShouldContain(unicodeSecretName);
      cy.exec(
        `oc get secret -n ${testName} ${unicodeSecretName} --template '{{.data.${secretKey}}}' | base64 -d`,
        {
          failOnNonZeroExit: false,
        },
      ).then((value) => {
        expect(unicodeSecret).toEqual(value.stdout);
      });
    });
  });
});
