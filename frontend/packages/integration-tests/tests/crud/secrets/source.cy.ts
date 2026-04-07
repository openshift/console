import { checkErrors, testName } from '../../../support';
import { detailsPage } from '../../../views/details-page';
import { secrets } from '../../../views/secret';

describe('Source secrets', () => {
  const basicSourceSecretName = `basic-source-secret-${testName}`;
  const basicSourceSecretUsername = 'username';
  const basicSourceSecretUsernameUpdated = 'usernameUpdated';
  const basicSourceSecretPassword = 'password';
  const basicSourceSecretPasswordUpdated = 'passwordUpdated';
  const sshSourceSecretName = `ssh-source-secret-${testName}`;
  const sshSourceSecretSSHKey = 'sshKey';
  const sshSourceSecretSSHKeUpdated = 'sshKeyUpdated';

  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  beforeEach(() => {
    // ensure the test project is selected to avoid flakes
    cy.visit(`/k8s/cluster/projects/${testName}`);
    cy.visit(`/k8s/ns/${testName}/secrets/`);
    secrets.clickCreateSecretDropdownButton('source');
  });

  afterEach(() => {
    cy.exec(`oc delete secret -n ${testName} ${basicSourceSecretName} ${sshSourceSecretName}`, {
      failOnNonZeroExit: false,
    });
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`Creates, edits, and deletes a basic source secret`, () => {
    cy.log('Create secret');
    cy.byTestID('page-heading').contains('Create source secret');
    secrets.enterSecretName(basicSourceSecretName);
    cy.byTestID('secret-username').type(basicSourceSecretUsername);
    cy.byTestID('secret-password').type(basicSourceSecretPassword);
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');
    secrets.detailsPageIsLoaded(basicSourceSecretName);

    cy.log('Verify secret');
    secrets.checkSecret({
      password: basicSourceSecretPassword,
      username: basicSourceSecretUsername,
    });

    cy.log('Edit secret');
    detailsPage.clickPageActionFromDropdown('Edit Secret');
    // Wait for form to load and hydrate with current values
    cy.byTestID('page-heading').contains('Edit source secret');
    cy.byTestID('secret-username').should('have.value', basicSourceSecretUsername);
    cy.byTestID('secret-password').should('have.value', basicSourceSecretPassword);
    cy.byTestID('secret-username').clear();
    cy.byTestID('secret-username').type(basicSourceSecretUsernameUpdated);
    cy.byTestID('secret-password').clear();
    cy.byTestID('secret-password').type(basicSourceSecretPasswordUpdated);
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');

    cy.log('Verify edit');
    secrets.detailsPageIsLoaded(basicSourceSecretName);
    secrets.checkSecret({
      password: basicSourceSecretPasswordUpdated,
      username: basicSourceSecretUsernameUpdated,
    });

    cy.log('Delete secret');
    secrets.deleteSecret(basicSourceSecretName);
  });

  it(`Creates, edits, and deletes a SSH source secret`, () => {
    cy.log('Create secret');
    cy.byTestID('page-heading').contains('Create source secret');
    secrets.enterSecretName(sshSourceSecretName);
    cy.byTestID('console-select-auth-type-menu-toggle').click();
    cy.byTestDropDownMenu('kubernetes.io/ssh-auth').click();
    cy.byLegacyTestID('file-input-textarea').type(sshSourceSecretSSHKey);
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');
    secrets.detailsPageIsLoaded(sshSourceSecretName);

    cy.log('Verify secret');
    secrets.checkSecret({
      'ssh-privatekey': `${sshSourceSecretSSHKey}\n`,
    });

    cy.log('Edit secret');
    detailsPage.clickPageActionFromDropdown('Edit Secret');
    // Wait for form to load and hydrate with current values
    cy.byTestID('page-heading').contains('Edit source secret');
    cy.byLegacyTestID('file-input-textarea').should('contain.value', sshSourceSecretSSHKey);
    cy.byLegacyTestID('file-input-textarea').clear();
    cy.byLegacyTestID('file-input-textarea').type(sshSourceSecretSSHKeUpdated);
    secrets.save();
    cy.byTestID('loading-indicator').should('not.exist');

    cy.log('Verify edit');
    secrets.detailsPageIsLoaded(sshSourceSecretName);
    secrets.checkSecret({
      'ssh-privatekey': `${sshSourceSecretSSHKeUpdated}\n`,
    });

    cy.log('Delete secret');
    secrets.deleteSecret(sshSourceSecretName);
  });
});
