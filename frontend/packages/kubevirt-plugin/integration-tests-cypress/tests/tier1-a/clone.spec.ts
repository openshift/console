import { testName } from '../../support';
import { Disk, Network, VirtualMachineData } from '../../types/vm';
import { K8S_KIND, NAD_NAME, TEMPLATE, VM_ACTION, VM_STATUS } from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { selectActionFromDropdown } from '../../views/actions';
import * as cloneView from '../../views/clone';
import { addDisk, addNIC } from '../../views/dialog';
import { actionButtons } from '../../views/selector';
import { tab } from '../../views/tab';
import { vm, waitForStatus } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `test-vm-clone-${testName}`,
  namespace: testName,
  template: TEMPLATE.RHEL6,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: true,
};

const nic1: Network = {
  name: 'nic-1',
  nad: NAD_NAME,
};

const disk1: Disk = {
  name: 'disk-1',
  size: '1',
};

const cloneVMName = `${vmData.name}-clone1`;
const cloneNS = `${testName}-clone-ns`;

describe('Test VM Clone', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.createProject(cloneNS);
    vm.create(vmData);
    cy.cdiCloner(testName, cloneNS);
    cy.createNAD(testName);
    cy.visitVMsList();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    cy.deleteResource(K8S_KIND.VM, `${vmData.name}-clone`, cloneNS);
    cy.deleteResource(K8S_KIND.VM, cloneVMName, vmData.namespace);
    cy.deleteResource(K8S_KIND.NAD, NAD_NAME, testName);
    cy.deleteTestProject(testName);
    cy.deleteTestProject(cloneNS);
  });

  it('ID(CNV-1730) Displays warning in clone wizard when cloned VM is running', () => {
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.kebabButton);
    cy.get('.pf-c-alert__title')
      .contains(`The VM ${vmData.name} is still running. It will be powered off while cloning.`)
      .should('exist');
    cy.get(cloneView.cancel).click();
  });

  it('ID(CNV-1863) Prefills correct data in the clone VM dialog', () => {
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.kebabButton);
    cy.get(cloneView.vmName).should('have.value', `${vmData.name}-clone`);
    cy.get(cloneView.nameSpace).should('have.value', testName);
    cy.get(cloneView.cancel).click();
  });

  it('ID(CNV-3058) Clones VM to a different namespace', () => {
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.kebabButton);
    cy.get(cloneView.vmName).should('have.value', `${vmData.name}-clone`);
    cy.get(cloneView.nameSpace)
      .select(cloneNS)
      .should('have.value', cloneNS);
    cy.get(cloneView.startOnClone).click();
    cy.get('#confirm-action').click();
  });

  it('ID(CNV-1732) Validates VM name', () => {
    cy.visitVMsList();
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToDetails();
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.actionDropdownButton);

    // Check warning is displayed when VM has same name as existing VM
    cy.get(cloneView.vmName)
      .clear()
      .type(vmData.name)
      .should('have.value', vmData.name);
    cy.get(cloneView.helpText)
      .contains('Name is already used by another virtual machine in this namespace')
      .should('exist');

    // Check warning is displayed when VM has same name as existing VM in another namespace
    cy.get(cloneView.nameSpace)
      .select(cloneNS)
      .should('have.value', cloneNS);
    cy.get(cloneView.helpText).should('not.exist');
    cy.get(cloneView.cancel).click();
  });

  it('ID(CNV-2825) Running VM is stopped when cloned', () => {
    cy.visitVMsList();
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToDetails();
    waitForStatus(VM_STATUS.Stopped);
  });

  it('ID(CNV-1733) Start cloned VM on creation', () => {
    cy.visitVMsList();
    cy.selectProject(cloneNS);
    cy.byLegacyTestID(`${vmData.name}-clone`)
      .should('exist')
      .click();
    tab.navigateToDetails();
    waitForStatus(VM_STATUS.Running);
  });

  it('ID(CNV-1734) Cloned VM has changed MAC address', () => {
    cy.visitVMsList();
    cy.byLegacyTestID(`${vmData.name}-clone`)
      .should('exist')
      .click();
    tab.navigateToNetwork();
    let mac1;
    cy.get('tr[data-id="default"]>td')
      .eq(4)
      .then(($mac) => {
        mac1 = $mac.text();
      });
    cy.visitVMsList();
    cy.selectProject(testName);
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToNetwork();
    cy.get('tr[data-id="default"]>td')
      .eq(4)
      .should(($mac) => {
        const mac2 = $mac.text();
        expect(mac1).not.toEqual(mac2);
      });
  });

  it('ID(CNV-1744) Clone VM with added NIC and disk', () => {
    cy.selectProject(testName);
    cy.visitVMsList();
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();

    tab.navigateToNetwork();
    addNIC(nic1);
    cy.get(`[data-id="${nic1.name}"]`).should('exist');
    tab.navigateToDisk();
    addDisk(disk1);
    cy.get(`[data-id="${disk1.name}"]`).should('exist');

    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.actionDropdownButton);
    cy.get(cloneView.vmName)
      .clear()
      .type(cloneVMName);
    cy.get(cloneView.confirmCloneButton).click();

    cy.visitVMsList();
    cy.byLegacyTestID(cloneVMName)
      .should('exist')
      .click();

    tab.navigateToNetwork();
    cy.get(`[data-id=${nic1.name}]`).should('exist');
    tab.navigateToDisk();
    cy.get(`[data-id=${disk1.name}]`).should('exist');
  });
});
