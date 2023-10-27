import { checkErrors, testName } from '../../../support';
import { detailsPage } from '../../../views/details-page';
import { secrets } from '../../../views/secret';

const heading = 'Create image pull secret';

describe('Image pull secrets', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  beforeEach(() => {
    cy.visit(`/k8s/ns/${testName}/secrets/`);
    secrets.clickCreateSecretDropdownButton('image');
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`Creates, edits, and deletes an image registry credentials pull secret`, () => {
    const credentialsImageSecretName = `registry-credentials-image-secret-${testName}`;
    const address = 'https://index.openshift.io/v';
    const addressUpdated = 'https://index.openshift.io/updated/v1';
    const username = 'username';
    const password = 'password';
    const username0 = `${username}0`;
    const password0 = `${password}0`;
    const username1 = `${username}1`;
    const password1 = `${password}1`;
    const usernameUpdated = `${username}Updated`;
    const passwordUpdated = `${password}Updated`;
    const mail = 'test@secret.com';
    const mail0 = `${mail}0`;
    const mail1 = `${mail}1`;
    const mailUpdated = 'testUpdated@secret.com';

    const credentialsToCheck = {
      '.dockerconfigjson': {
        auths: {
          'https://index.openshift.io/v0': {
            username: username0,
            password: password0,
            auth: secrets.encode(username0, password0),
            email: mail0,
          },
          'https://index.openshift.io/v1': {
            username: username1,
            password: password1,
            auth: secrets.encode(username1, password1),
            email: mail1,
          },
        },
      },
    };
    const updatedCredentialsToCheck = {
      '.dockerconfigjson': {
        auths: {
          'https://index.openshift.io/updated/v1': {
            username: usernameUpdated,
            password: passwordUpdated,
            auth: secrets.encode(usernameUpdated, passwordUpdated),
            email: mailUpdated,
          },
        },
      },
    };

    cy.log('Create secret');
    cy.get('.co-m-pane__heading').contains(heading);
    secrets.enterSecretName(credentialsImageSecretName);
    secrets.clickAddCredentialsButton();
    cy.get('[data-test-id="create-image-secret-form"]').each(($el, index) => {
      cy.wrap($el).find('[data-test="image-secret-address"]').type(`${address}${index}`);
      cy.wrap($el).find('[data-test="image-secret-username"]').type(`${username}${index}`);
      cy.wrap($el).find('[data-test="image-secret-password"]').type(`${password}${index}`);
      cy.wrap($el).find('[data-test="image-secret-email"]').type(`${mail}${index}`);
    });
    secrets.save();
    secrets.detailsPageIsLoaded(credentialsImageSecretName);

    cy.log('Verify secret');
    secrets.checkSecret(credentialsToCheck, true);

    cy.log('Edit secret');
    detailsPage.clickPageActionFromDropdown('Edit Secret');
    secrets.clickRemoveEntryButton();
    cy.byTestID('image-secret-address').clear();
    cy.byTestID('image-secret-address').type(addressUpdated);
    cy.byTestID('image-secret-username').clear();
    cy.byTestID('image-secret-username').type(usernameUpdated);
    cy.byTestID('image-secret-password').clear();
    cy.byTestID('image-secret-password').type(passwordUpdated);
    cy.byTestID('image-secret-email').clear();
    cy.byTestID('image-secret-email').type(mailUpdated);
    secrets.save();

    cy.log('Verify edit');
    secrets.detailsPageIsLoaded(credentialsImageSecretName);
    secrets.checkSecret(updatedCredentialsToCheck, true);

    cy.log('Delete secret');
    secrets.deleteSecret(credentialsImageSecretName);
  });

  it(`Creates and deletes an upload configuration file image pull secret`, () => {
    const uploadConfigFileImageSecretName = `upload-configuration-file-image-secret-${testName}`;
    const username = 'username';
    const password = 'password';
    const configFile = {
      auths: {
        'https://index.openshift.io/v1': {
          username,
          password,
          auth: secrets.encode(username, password),
          email: 'test@secret.com',
        },
      },
    };

    cy.log('Create secret');
    cy.get('.co-m-pane__heading').contains(heading);
    secrets.enterSecretName(uploadConfigFileImageSecretName);
    cy.byLegacyTestID('dropdown-button').click();
    cy.byTestDropDownMenu('config-file').click();
    cy.byLegacyTestID('file-input-textarea').type(JSON.stringify(configFile), {
      parseSpecialCharSequences: false,
    });
    secrets.save();
    secrets.detailsPageIsLoaded(uploadConfigFileImageSecretName);

    cy.log('Verify secret');
    secrets.checkSecret(
      {
        '.dockerconfigjson': configFile,
      },
      true,
    );

    cy.log('Delete secret');
    secrets.deleteSecret(uploadConfigFileImageSecretName);
  });
});
