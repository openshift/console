import { TEMPLATE_NAME, VM_ACTION, VM_ACTION_TIMEOUT, VM_STATUS } from '../../const/index';
import { ProvisionSource } from '../../enums/provisionSource';
import { testName } from '../../support';
import { Disk, Network, VirtualMachineData } from '../../types/vm';
import { selectActionFromDropdown } from '../../view/actions';
import * as cloneView from '../../view/clone';
import { addNIC, addDisk } from '../../view/dialog';
import { actionButtons } from '../../view/selector';
import { tab } from '../../view/tab';
import { virtualization } from '../../view/virtualization';
import { vm, waitForStatus } from '../../view/vm';

const vmData: VirtualMachineData = {
  name: `test-vm-clone-${testName}`,
  namespace: testName,
  template: TEMPLATE_NAME,
  provisionSource: ProvisionSource.URL,
  pvcSize: '1',
  sshEnable: false,
  startOnCreation: false,
};

const nic1: Network = {
  name: 'nic-1',
  nad: 'bridge-network',
};

const disk1: Disk = {
  name: 'disk-1',
  size: '1',
};

describe('Test VM Clone', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    vm.create(vmData);
    cy.cdiCloner(testName, 'default');
    cy.createNAD(testName);
    virtualization.vms.visit();
    waitForStatus(VM_STATUS.Off, vmData, VM_ACTION_TIMEOUT.VM_IMPORT);
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vmData.name,
        namespace: vmData.namespace,
      },
    });
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: `${vmData.name}-clone`,
        namespace: 'default',
      },
    });
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: `${vmData.name}-clone1`,
        namespace: vmData.namespace,
      },
    });
    cy.deleteResource({
      kind: 'NetworkAttachmentDefinition',
      metadata: {
        name: 'bridge-network',
        namespace: testName,
      },
    });
  });

  it('ID(CNV-1730) Displays warning in clone wizard when cloned VM is running', () => {
    vm.start(vmData);
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.kebabButton);
    cy.get('.pf-c-alert__title')
      .contains(`The VM ${vmData.name} is still running. It will be powered off while cloning.`)
      .should('exist');
  });

  it('ID(CNV-1863) Prefills correct data in the clone VM dialog', () => {
    cy.get(cloneView.vmName).should('have.value', `${vmData.name}-clone`);
    cy.get(cloneView.nameSpace).should('have.value', testName);
  });

  it('ID(CNV-3058) Clones VM to a different namespace', () => {
    cy.get(cloneView.vmName).should('have.value', `${vmData.name}-clone`);
    cy.get(cloneView.nameSpace)
      .select('default')
      .should('have.value', 'default');
    cy.get(cloneView.startOnClone).click();
    cy.get('#confirm-action').click();
  });

  it('ID(CNV-1732) Validates VM name', () => {
    virtualization.vms.visit();
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
      .select('default')
      .should('have.value', 'default');
    cy.get(cloneView.helpText).should('not.exist');
    cy.get(cloneView.cancel).click();
  });

  it('ID(CNV-2825) Running VM is stopped when cloned', () => {
    virtualization.vms.visit();
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToDetails();
    waitForStatus(VM_STATUS.Off);
  });

  it('ID(CNV-1733) Start cloned VM on creation', () => {
    virtualization.vms.visit();
    cy.selectProject('default');
    cy.byLegacyTestID(`${vmData.name}-clone`)
      .should('exist')
      .click();
    tab.navigateToDetails();
    waitForStatus(VM_STATUS.Starting, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
    waitForStatus(VM_STATUS.Running, vmData, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);
  });

  it('ID(CNV-1734) Cloned VM has changed MAC address', () => {
    virtualization.vms.visit();
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
    virtualization.vms.visit();
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
    virtualization.vms.visit();
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
      .type(`${vmData.name}-clone1`);
    cy.get(cloneView.confirmCloneButton).click();

    virtualization.vms.visit();
    cy.byLegacyTestID(`${vmData.name}-clone1`)
      .should('exist')
      .click();

    tab.navigateToNetwork();
    cy.get(`[data-id=${nic1.name}]`).should('exist');
    tab.navigateToDisk();
    cy.get(`[data-id=${disk1.name}]`).should('exist');
  });
});
