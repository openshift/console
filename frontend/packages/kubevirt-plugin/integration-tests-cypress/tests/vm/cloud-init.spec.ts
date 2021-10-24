import * as editor from '../../../../integration-tests-cypress/views/yaml-editor';
import { testName } from '../../support';
import { CloudInitConfig, VirtualMachineData } from '../../types/vm';
import {K8S_KIND, TEMPLATE, VM_STATUS, VM_ACTION_TIMEOUT} from '../../utils/const';
import { ProvisionSource } from '../../utils/const/provisionSource';
import * as wizardView from '../../views/selector-wizard';
import { wizard } from '../../views/wizard';
import {loginVNC, credentialsText} from "../../views/console";
import {tab} from "../../views/tab";
import {vm, waitForStatus} from "../../views/vm";
import {detailsTab} from "../../views/selector";

const RHEL8GuestAgentURL = `http://cnv-qe-server.rhevdev.lab.eng.rdu2.redhat.com/files/cnv-tests/rhel-images/rhel-8.qcow2`;

class GuestAgentProvSrc extends ProvisionSource {
  static readonly gaURL = new ProvisionSource(
    'URL',
    'Import via URL (creates PVC)',
    RHEL8GuestAgentURL
  );
}
const yamlUserName = `user-${testName}`;
const yamlPassword = `pwd-${testName}`;
const yamlHostName = `vm-${testName}`;
const yamlSshKey = 'AAAAB3NzaC1yc2EAAAADAQABAAABgQD4btGCi0gEDKVNmDLmr5Q6qitFn3U1I7EHyWmltqnoNTjdbQ2uj5VPnejx58IeH9U9MKgnlH1xUkrMv7rX5hFQvlAk+/nKlWmitkiBD8rvzT///IbgGnC+Vzn6ORyZkTyalIn3WpjAY5Ma+nmoCZOMwxUvJH0VcD36xaa6cjs3rBvMXOsqt8TLxcw6Wmuu93VP7mrMWwcH12J5bxZK/fGezo1hIKCegsQZpDoiURN6U+5lIVMYNugbAT1iEth8vNxO3rWBkk5iu3z2gB27zcY8FM7mdXU0GbxVolW8taU1O4oJvWFnXU62/+RyTGcVs/RjCueL1aPoGcEpKuFKGCvnUUE4Go6TwLoy3XdyEHvRRcEYTwuYAYamgwCDzeyQRlQN/db4hDYRoiZ3p8Jin5C3F+VaBl5aeDeXhGxjxxubV69bKiak383D6wrZg038bO5am7pqfIpafAXWP2sASKs2Q4zQask/M4GFpd9/9zDZi6iY11hPU9bfuuzak8Cs7/M=';
const yamlEmail = 'cnvuitester@redhat.com';

const cloudInitScriptKeyHost = `hostname: ${yamlHostName}\nssh_authorized_keys:\n  - >-\n    ssh-rsa\n    ${yamlSshKey}\n    ${yamlEmail}`;

const cloudInitScriptFull = `#cloud-config\nuser: ${yamlUserName}\npassword: ${yamlPassword}\nchpasswd: {expire: False}\n${cloudInitScriptKeyHost}`;

const cloudInitDataScript: CloudInitConfig = {
  customScript: cloudInitScriptFull,
};

const cloudInitDataTmp: CloudInitConfig = {
  userName: `tmp-${yamlUserName}`,
  password: `tmp-${yamlPassword}`,
  hostname: `tmp-${yamlHostName}`,
};

const defWizVM: VirtualMachineData = {
  name: `vm-defwiz-${testName}`,
  description: 'VM by default wizard',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: GuestAgentProvSrc.gaURL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const defCustWizVM: VirtualMachineData = {
  name: `vm-custwiz-${testName}`,
  description: 'VM by custom wizard',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: GuestAgentProvSrc.gaURL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const custWizUserVM: VirtualMachineData = {
  name: `vm-user-${testName}`,
  description: 'VM by custom wizard with user data',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: GuestAgentProvSrc.gaURL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const cloudInitFullVM: VirtualMachineData = {
  name: `vm-full-${testName}`,
  description: 'VM by custom wizard with user data',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: GuestAgentProvSrc.gaURL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

const cloudInitScriptVM: VirtualMachineData = {
  name: `vm-script-${testName}`,
  description: 'VM creation wizard Cloud init customScript',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: GuestAgentProvSrc.gaURL,
  pvcSize: '1',
  sshEnable: true,
  startOnCreation: true,
  cloudInit: cloudInitDataScript,
};

describe('VM creation wizard Cloud init ', () => {

  const startLaunchVM = (vmData: VirtualMachineData) => {
    cy.visitVMsList();
    wizard.vm.open();
    wizard.vm.selectTemplate(vmData);
    cy.get(wizardView.imageSourceDropdown).click();
    cy.get(wizardView.selectMenu)
      .contains(GuestAgentProvSrc.gaURL.getDescription())
      .click({ force: true });
    cy.get(wizardView.sourceURL).type(RHEL8GuestAgentURL);
    cy.get(wizardView.next).click();
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
    cy.contains(detailsTab.vmStatus, /^Running$/, {
      timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP*2,
    }).should('exist');
  };

  const verifyUserLogin = (userName: string, password: string) => {
    tab.navigateToConsole();
    cy.get('#cloudinit-credentials')
      .filter(':contains("Guest login credentials")')
      .click();
    cy.get(credentialsText)
      .should('be.visible')
      .should('contain', userName)
      .should('contain', password);
    cy.get('.pf-c-console__vnc canvas')
      .should('exist');
    loginVNC();
    cy.wait(1000);
    tab.navigateToDetails();
    cy.wait(1000);
    cy.get(detailsTab.activeUser).should('contain', userName);
  };

  before(() => {
    cy.Login();
    cy.createProject(testName);
  });

  after(() => {
    [
      defWizVM,
      defCustWizVM,
      custWizUserVM,
      cloudInitFullVM,
      cloudInitScriptVM
    ].forEach(function (vmData) {
      cy.deleteResource(K8S_KIND.VM, vmData.name, testName);
    });
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-6879) VM creation wizard advanced cloud init editor should have user and password fields in the form editor', () => {
    startLaunchVM(cloudInitFullVM);
    cy.get(wizardView.username).should('exist');
    cy.get(wizardView.password).should('exist');
    cy.get(wizardView.cancelBtn);
    cy.byButtonText('Cancel').click();
  });

  it('ID(CNV-6878) VM creation wizard advanced cloud init editor should preserve state when moving from yaml editor to form editor', () => {
    const { cloudInit } = cloudInitFullVM;
    startLaunchVM(cloudInitFullVM);
    cy.get(wizardView.username)
      .clear()
      .type(cloudInitDataTmp.userName);
    cy.get(wizardView.password)
      .clear()
      .type(cloudInitDataTmp.password);
    cy.get(wizardView.hostname)
      .clear()
      .type(cloudInitDataTmp.hostname);
    cy.get(wizardView.yamlView).click();
    editor
      .getEditorContent()
      .should('contain', `user: ${cloudInitDataTmp.userName}`)
      .should('contain', `password: ${cloudInitDataTmp.password}`)
      .should('contain', `hostname: ${cloudInitDataTmp.hostname}`);
    editor.setEditorContent(cloudInitScriptFull);
    cy.get(wizardView.formView).click();
    cy.get(wizardView.username).should('have.value', cloudInit.userName);
    cy.get(wizardView.password).should('have.value', cloudInit.password);
    cy.get(wizardView.hostname).should('have.value', cloudInit.hostname);
    cy.get(wizardView.sshKeys(0)).should('have.value', `ssh-rsa ${yamlSshKey} ${yamlEmail}`);
    cy.get(wizardView.cancelBtn);
    cy.byButtonText('Cancel').click();
  });

  it('ID(CNV-7294) VNC console login to VM created with default wizard', () => {
    vm.create(defWizVM);
    verifyUserLogin('cloud-user', '');
  });

  it('ID(CNV-7317) VNC console login to VM created with advanced wizard', () => {
    startLaunchVM(defCustWizVM);
    finishLaunchVM();
    verifyUserLogin('cloud-user', '');
  });

  it('ID(CNV-7370) VNC console login to VM created with user data', async () => {
    startLaunchVM(custWizUserVM);
    cy.get(wizardView.username)
      .clear()
      .type(cloudInitDataTmp.userName);
    cy.get(wizardView.password)
      .clear()
      .type(cloudInitDataTmp.password);
    finishLaunchVM();
    verifyUserLogin(cloudInitDataTmp.userName, cloudInitDataTmp.password);
  });

  it('ID(CNV-7371) VNC console login to VM created with cloudinit script', async () => {
    startLaunchVM(cloudInitFullVM);
    cy.get(wizardView.yamlView).click();
    editor.setEditorContent(cloudInitScriptFull);
    finishLaunchVM();
    verifyUserLogin(yamlUserName, yamlPassword);
  });
});
