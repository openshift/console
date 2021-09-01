import * as editor from '../../../../integration-tests-cypress/views/yaml-editor';
import { testName } from '../../support';
import { CloudInitConfig, VirtualMachineData } from '../../types/vm';
import { TEMPLATE } from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import * as wizardView from '../../views/selector-wizard';
import { virtualization } from '../../views/virtualization';
import { wizard } from '../../views/wizard';

const yamlUserName = 'cnv-ui-tester';
const yamlPassword = 'top-sec-ret';
const yamlHostName = 'otherhost';
const yamlSshKey =
  'AAAAB3NzaC1yc2EAAAADAQABAAABgQD4btGCi0gEDKVNmDLmr5Q6qitFn3U1I7EHyWmltqnoNTjdbQ2uj5VPnejx58IeH9U9MKgnlH1xUkrMv7rX5hFQvlAk+/nKlWmitkiBD8rvzT///IbgGnC+Vzn6ORyZkTyalIn3WpjAY5Ma+nmoCZOMwxUvJH0VcD36xaa6cjs3rBvMXOsqt8TLxcw6Wmuu93VP7mrMWwcH12J5bxZK/fGezo1hIKCegsQZpDoiURN6U+5lIVMYNugbAT1iEth8vNxO3rWBkk5iu3z2gB27zcY8FM7mdXU0GbxVolW8taU1O4oJvWFnXU62/+RyTGcVs/RjCueL1aPoGcEpKuFKGCvnUUE4Go6TwLoy3XdyEHvRRcEYTwuYAYamgwCDzeyQRlQN/db4hDYRoiZ3p8Jin5C3F+VaBl5aeDeXhGxjxxubV69bKiak383D6wrZg038bO5am7pqfIpafAXWP2sASKs2Q4zQask/M4GFpd9/9zDZi6iY11hPU9bfuuzak8Cs7/M=';
const yamlEmail = 'cnvuitester@redhat.com';
const cloudInitScript = `#cloud-config\nuser: ${yamlUserName}\npassword: ${yamlPassword}\nchpasswd: {expire: False}\nhostname: ${yamlHostName}\nssh_authorized_keys:\n  - >-\n    ssh-rsa\n    ${yamlSshKey}\n    cnvuitester@redhat.com`;

const cloudInitData: CloudInitConfig = {
  yamlView: false,
  userName: `user-${testName}`,
  password: `pwd-${testName}`,
  hostname: `host-${testName}`,
  customScript: cloudInitScript,
};

const vmData: VirtualMachineData = {
  name: `vm-${testName}`,
  description: 'VM creation wizard Cloud init',
  namespace: testName,
  template: TEMPLATE.RHEL6.name,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
  cloudInit: cloudInitData,
};

describe('VM creation wizard Cloud init editor fields', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    virtualization.vms.visit();
    wizard.vm.open();
    wizard.vm.selectTemplate(vmData);
    wizard.vm.fillBootSourceForm(vmData);
    cy.get(wizardView.projectDropdown)
      .click()
      .then(() => {
        cy.get(`#${testName}-Project-link`).click();
      });
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
  });

  after(() => {
    cy.get(wizardView.cancelBtn);
    cy.deleteResource({
      kind: 'Namespace',
      metadata: {
        name: testName,
      },
    });
  });

  it('ID(CNV-6879) VM creation wizard advanced cloud init editor should have user and password fields in the form editor', () => {
    cy.get(wizardView.username).should('exist');
    cy.get(wizardView.password).should('exist');
  });

  it('ID(CNV-6878) VM creation wizard advanced cloud init editor should preserve state when moving from yaml editor to form editor', () => {
    const { cloudInit } = vmData;
    cy.get(wizardView.username)
      .clear()
      .type(cloudInit.userName);
    cy.get(wizardView.password)
      .clear()
      .type(cloudInit.password);
    cy.get(wizardView.hostname)
      .clear()
      .type(cloudInit.hostname);
    cy.get(wizardView.yamlView).click();
    editor
      .getEditorContent()
      .should('contain', `password: ${cloudInit.password}`)
      .should('contain', `user: ${cloudInit.userName}`)
      .should('contain', `hostname: ${cloudInit.hostname}`);
    editor.setEditorContent(cloudInitScript);
    cy.get(wizardView.formView).click();
    cy.get(wizardView.username).should('have.value', yamlUserName);
    cy.get(wizardView.password).should('have.value', yamlPassword);
    cy.get(wizardView.hostname).should('have.value', yamlHostName);
    cy.get(wizardView.sshKeys(0)).should('have.value', `ssh-rsa ${yamlSshKey} ${yamlEmail}`);
  });
});
