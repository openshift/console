import { checkErrors, testName } from '../../../support';
import { detailsPage } from '../../../views/details-page';
import { listPage } from '../../../views/list-page';
import { nav } from '../../../views/nav';
import { secrets } from '../../../views/secret';

const populateSecretForm = (name: string, key: string, fileName: string) => {
  cy.get('[data-test="page-heading"] h1').contains('Create key/value secret');
  cy.byTestID('secret-name').should('exist');
  cy.byLegacyTestID('file-input-textarea').should('exist');
  secrets.enterSecretName(name);
  cy.byTestID('secret-key').type(key);
  cy.get('.co-file-input').selectFile(
    `${Cypress.config('fileServerFolder')}/fixtures/${fileName}`,
    {
      action: 'drag-drop',
      force: true,
    },
  );
};

const modifySecretForm = (key: string) => {
  detailsPage.clickPageActionFromDropdown('Edit Secret');
  cy.get('[data-test="page-heading"] h1').contains('Edit key/value secret');
  cy.byTestID('secret-key').clear().type(key);
};

describe('Create key/value secrets', () => {
  const binarySecretName = `key-value-binary-secret-${testName}`;
  const asciiSecretName = `key-value-ascii-secret-${testName}`;
  const unicodeSecretName = `key-value-unicode-secret-${testName}`;
  const tlsSecretName = `key-value-tls-secret-${testName}`;
  const binaryFilename = 'binarysecret.bin';
  const asciiFilename = 'asciisecret.txt';
  const unicodeFilename = 'unicodesecret.utf8';
  const secretKey = `secretkey`;
  const modifiedSecretKey = 'modifiedsecretkey';
  const tlsSecretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: ${tlsSecretName}
type: kubernetes.io/tls
data:
  tls.crt: QUFBCg==
  tls.key: QkJCCg==
`;

  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    cy.exec(`echo '${tlsSecretYaml}' | oc create -f - -n ${testName}`);
  });

  beforeEach(() => {
    // ensure the test project is selected to avoid flakes
    cy.visit(`/k8s/cluster/projects/${testName}`);
    nav.sidenav.clickNavLink(['Workloads', 'Secrets']);
    listPage.titleShouldHaveText('Secrets');
    secrets.clickCreateSecretDropdownButton('generic');
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
    cy.deleteProjectWithCLI(testName);
  });

  it(`Validate create and edit of a key/value secret whose value is a binary file`, () => {
    populateSecretForm(binarySecretName, secretKey, binaryFilename);
    cy.byLegacyTestID('file-input-textarea').should('not.exist');
    cy.byTestID('file-input-binary-alert').should('exist');
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(binarySecretName);
    cy.exec(
      `oc get secret -n ${testName} ${binarySecretName} --template '{{.data.${secretKey}}}'`,
      {
        failOnNonZeroExit: false,
      },
    ).then((value) => {
      cy.fixture(binaryFilename, 'base64').then((binarySecret) => {
        expect(binarySecret).toEqual(value.stdout);
      });
    });
    modifySecretForm(modifiedSecretKey);
    cy.byTestID('file-input-binary-alert').should('exist');
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');
    detailsPage.isLoaded();
    detailsPage.titleShouldContain(binarySecretName);
    cy.exec(
      `oc get secret -n ${testName} ${binarySecretName} --template '{{.data.${modifiedSecretKey}}}'`,
      {
        failOnNonZeroExit: false,
      },
    ).then((value) => {
      cy.fixture(binaryFilename, 'base64').then((binarySecret) => {
        expect(binarySecret).toEqual(value.stdout);
      });
    });
  });

  it(`Validate a key/value secret whose value is an ascii file`, () => {
    populateSecretForm(asciiSecretName, secretKey, asciiFilename);
    cy.fixture(asciiFilename, 'ascii').then((asciiSecret) => {
      cy.byLegacyTestID('file-input-textarea').should('contain.text', asciiSecret);
      cy.byTestID('file-input-binary-alert').should('not.exist');
      secrets.save();
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
      cy.byTestID('file-input-binary-alert').should('not.exist');
      secrets.save();
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

  it('Validate tls secret is editable', () => {
    cy.visit(`/k8s/ns/${testName}/secrets/${tlsSecretName}/edit`);
    secrets.addKeyValue('keyfortest', 'valuefortest');
    secrets.save();
    secrets.detailsPageIsLoaded(tlsSecretName);
    secrets.checkKeyValueExist('keyfortest', 'valuefortest');
  });
});
