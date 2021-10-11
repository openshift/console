import * as editor from '../../../../integration-tests-cypress/views/yaml-editor';
import { testName } from '../../support';
import { CloudInitConfig, VirtualMachineData } from '../../types/vm';
import {TEMPLATE, VM_STATUS, K8S_KIND} from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import * as wizardView from '../../views/selector-wizard';
import { wizard } from '../../views/wizard';
import {waitForStatus} from "../../views/vm";
import { tab } from '../../views/tab';
import {detailViewAction, listViewAction} from "../../views/actions";
import {loginVNC} from "../../views/console";

const yamlUserName = `user-${testName}`;
const yamlPassword = `pwd-${testName}`;
const yamlHostName = `vm-${testName}`;
const yamlSshKey = 'AAAAB3NzaC1yc2EAAAADAQABAAABgQD4btGCi0gEDKVNmDLmr5Q6qitFn3U1I7EHyWmltqnoNTjdbQ2uj5VPnejx58IeH9U9MKgnlH1xUkrMv7rX5hFQvlAk+/nKlWmitkiBD8rvzT///IbgGnC+Vzn6ORyZkTyalIn3WpjAY5Ma+nmoCZOMwxUvJH0VcD36xaa6cjs3rBvMXOsqt8TLxcw6Wmuu93VP7mrMWwcH12J5bxZK/fGezo1hIKCegsQZpDoiURN6U+5lIVMYNugbAT1iEth8vNxO3rWBkk5iu3z2gB27zcY8FM7mdXU0GbxVolW8taU1O4oJvWFnXU62/+RyTGcVs/RjCueL1aPoGcEpKuFKGCvnUUE4Go6TwLoy3XdyEHvRRcEYTwuYAYamgwCDzeyQRlQN/db4hDYRoiZ3p8Jin5C3F+VaBl5aeDeXhGxjxxubV69bKiak383D6wrZg038bO5am7pqfIpafAXWP2sASKs2Q4zQask/M4GFpd9/9zDZi6iY11hPU9bfuuzak8Cs7/M=';
const yamlEmail = 'cnvuitester@redhat.com';

const cloudInitScriptKeyHost = `hostname: ${yamlHostName}\nssh_authorized_keys:\n  - >-\n    ssh-rsa\n    ${yamlSshKey}\n    ${yamlEmail}`;

const cloudInitScriptFull = `#cloud-config\nuser: ${yamlUserName}\npassword: ${yamlPassword}\nchpasswd: {expire: False}\n${cloudInitScriptKeyHost}`;

const cloudInitDataFull: CloudInitConfig = {
  yamlView: false,
  userName: yamlUserName,
  password: yamlPassword,
  hostname: yamlHostName,
  customScript: cloudInitScriptFull,
};

const cloudInitFullVM: VirtualMachineData = {
  name: `vm-${testName}`,
  description: 'VM creation wizard Cloud init full data',
  namespace: testName,
  template: TEMPLATE.FEDORA,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
  cloudInit: cloudInitDataFull,
};

const cloudInitDataKeyHost: CloudInitConfig = {
  yamlView: false,
  hostname: yamlHostName,
  customScript: cloudInitScriptKeyHost,
};

const cloudInitKeyHostVM: VirtualMachineData = {
  name: `vm-${testName}`,
  description: 'VM creation wizard Cloud init key and hostname',
  namespace: testName,
  template: TEMPLATE.FEDORA,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: true,
  startOnCreation: true,
  cloudInit: cloudInitDataKeyHost,
};

const cloudInitDataScript: CloudInitConfig = {
  yamlView: false,
  customScript: cloudInitScriptFull,
};

const cloudInitScriptVM: VirtualMachineData = {
  name: `vm-${testName}`,
  description: 'VM creation wizard Cloud init customScript',
  namespace: testName,
  template: TEMPLATE.FEDORA,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: true,
  startOnCreation: true,
  cloudInit: cloudInitDataScript,
};

const startLaunchVM = (vmData: VirtualMachineData) => {
  cy.visitVMsList();
  wizard.vm.open();
  wizard.vm.selectTemplate(vmData);
  wizard.vm.fillBootSourceForm(vmData);
  cy.get(wizardView.projectDropdown)
    .click();
  cy.get(`#${testName}-Project-link`)
    .click();
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

const finishLaunchVM = () => {
  cy.get('#create-vm-wizard-reviewandcreate-btn')
    .click();
  cy.get('#create-vm-wizard-submit-btn')
    .click();
  cy.byLegacyTestID('kubevirt-wizard-success-result')
    .should('be.visible');
  cy.get('.pf-c-button.pf-m-primary')
    .filter(':contains("See virtual machine details")')
    .click();
  waitForStatus(VM_STATUS.Running);
};

describe('Kubevirt create VM using cloud-init', () => {

  before(() => {
    cy.Login();
    cy.createProject(testName);
  });

  after(() => {
    [cloudInitScriptVM].forEach(function (vmData) {
      cy.deleteResource(K8S_KIND.VM, vmData.name, testName);
    });
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-874) Create vm using hostname and key as cloud-init data', async () => {
    startLaunchVM(cloudInitKeyHostVM);
    finishLaunchVM();
    tab.navigateToYAML();
    editor
      .getEditorContent()
      .should('contain', `hostname: ${cloudInitKeyHostVM.cloudInit.hostname}`)
      .should('contain', yamlSshKey);
  });

  it('ID(CNV-4022) Create VM using custom script as cloud-init data', async () => {
    startLaunchVM(cloudInitScriptVM);
    cy.get(wizardView.yamlView).click();
    editor.setEditorContent(cloudInitScriptFull);
    cy.get(wizardView.formView).click();
    finishLaunchVM();
    tab.navigateToYAML();
    editor
      .getEditorContent()
      .should('contain', `hostname: ${cloudInitDataKeyHost.hostname}`)
      .should('contain', `${yamlSshKey}`);
  });

  it('ID(CNV-7294) Cloudinit user defined credentials work in created VM', () => {
    startLaunchVM(cloudInitFullVM);
    finishLaunchVM();
    tab.navigateToConsole();
    cy.get('#cloudinit-credentials')
      .filter(':contains("Guest login credentials")')
      .click();
    cy.get('.pf-c-accordion__expanded-content')
      .should('be.visible');
    cy.get('.pf-c-accordion__expanded-content-body>p')
      .should('contain', `${cloudInitFullVM.cloudInit.password}`);
    cy.get('.pf-c-console__vnc canvas')
      .should('exist').pause();
    loginVNC();
  });
});
