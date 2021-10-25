import * as editor from '../../../../integration-tests-cypress/views/yaml-editor';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import { TEMPLATE } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import * as wizardView from '../../views/selector-wizard';
import { wizard } from '../../views/wizard';

const custUserName = `tmp-test-user`;
const custPassword = `set-own-pwd`;
const custHostName = `tmp-test-vm`;
const yamlUserName = `user-${testName}`;
const yamlPassword = `pwd-${testName}`;
const yamlHostName = `vm-${testName}`;
const yamlSshKey =
  'AAAAB3NzaC1yc2EAAAADAQABAAABgQD4btGCi0gEDKVNmDLmr5Q6qitFn3U1I7EHyWmltqnoNTjdbQ2uj5VPnejx58IeH9U9MKgnlH1xUkrMv7rX5hFQvlAk+/nKlWmitkiBD8rvzT///IbgGnC+Vzn6ORyZkTyalIn3WpjAY5Ma+nmoCZOMwxUvJH0VcD36xaa6cjs3rBvMXOsqt8TLxcw6Wmuu93VP7mrMWwcH12J5bxZK/fGezo1hIKCegsQZpDoiURN6U+5lIVMYNugbAT1iEth8vNxO3rWBkk5iu3z2gB27zcY8FM7mdXU0GbxVolW8taU1O4oJvWFnXU62/+RyTGcVs/RjCueL1aPoGcEpKuFKGCvnUUE4Go6TwLoy3XdyEHvRRcEYTwuYAYamgwCDzeyQRlQN/db4hDYRoiZ3p8Jin5C3F+VaBl5aeDeXhGxjxxubV69bKiak383D6wrZg038bO5am7pqfIpafAXWP2sASKs2Q4zQask/M4GFpd9/9zDZi6iY11hPU9bfuuzak8Cs7/M=';
const yamlEmail = 'cnvuitester@redhat.com';

const cloudInitScriptUserData = `#cloud-config\nuser: ${yamlUserName}\npassword: ${yamlPassword}\nchpasswd: {expire: False}`;

const cloudInitScriptKeyHost = `hostname: ${yamlHostName}\nssh_authorized_keys:\n  - >-\n    ssh-rsa\n    ${yamlSshKey}\n    ${yamlEmail}`;

const cloudInitCustScriptFull = `${cloudInitScriptUserData}\n${cloudInitScriptKeyHost}`;

const advWizVM: VirtualMachineData = {
  name: `vm-defwiz-${testName}`,
  description: 'VM by advanced wizard',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.URL,
  startOnCreation: true,
};

const startLaunchVM = (vmData: VirtualMachineData) => {
  cy.visitVMsList();
  wizard.vm.open();
  wizard.vm.selectTemplate(vmData);
  cy.get(wizardView.imageSourceDropdown).click();
  cy.get(wizardView.selectMenu)
    .contains(ProvisionSource.URL.getDescription())
    .click({ force: true });
  cy.get(wizardView.sourceURL).type(ProvisionSource.URL.getSource());
  cy.get(wizardView.next).click();
  cy.get(wizardView.projectDropdown).click();
  cy.get(`#${testName}-Project-link`).click();
  cy.get(wizardView.vmName)
    .clear()
    .type(vmData.name);
  cy.get(wizardView.customizeBtn).click();
  cy.get(wizardView.wizardNavLink)
    .filter(':contains("Advanced")')
    .click();
  cy.get(wizardView.cloudInit).then((accordion) => {
    if (accordion.attr('area-expanded') === 'false') {
      accordion.click();
    }
  });
};

describe('VM creation wizard Cloud Init', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
  });

  after(() => {
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-6879) VM creation wizard cloud init editor should have user and password fields in the form editor', () => {
    startLaunchVM(advWizVM);
    cy.get(wizardView.username).should('exist');
    cy.get(wizardView.password).should('exist');
    cy.get(wizardView.cancelBtn);
    cy.byButtonText('Cancel').click();
  });

  it('ID(CNV-6878) VM creation wizard cloud init editor should preserve state when moving from yaml editor to form editor', () => {
    startLaunchVM(advWizVM);
    cy.get(wizardView.username)
      .clear()
      .type(custUserName);
    cy.get(wizardView.password)
      .clear()
      .type(custPassword);
    cy.get(wizardView.hostname)
      .clear()
      .type(custHostName);
    cy.get(wizardView.yamlView).click();
    editor
      .getEditorContent()
      .should('contain', `user: ${custUserName}`)
      .should('contain', `password: ${custPassword}`)
      .should('contain', `hostname: ${custHostName}`);
    editor.setEditorContent(cloudInitCustScriptFull);
    cy.get(wizardView.formView).click();
    cy.get(wizardView.username).should('have.value', yamlUserName);
    cy.get(wizardView.password).should('have.value', yamlPassword);
    cy.get(wizardView.hostname).should('have.value', yamlHostName);
    cy.get(wizardView.sshKeys(0)).should('have.value', `ssh-rsa ${yamlSshKey} ${yamlEmail}`);
    cy.get(wizardView.cancelBtn);
    cy.byButtonText('Cancel').click();
  });
});
