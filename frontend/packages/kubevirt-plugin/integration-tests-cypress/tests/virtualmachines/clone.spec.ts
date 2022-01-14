import { Disk, Network } from '../../types/vm';
import {
  K8S_KIND,
  NAD_NAME,
  TEST_NS,
  TEST_VM,
  VM_ACTION,
  VM_STATUS,
} from '../../utils/const/index';
import { selectActionFromDropdown } from '../../views/actions';
import * as cloneView from '../../views/clone';
import { addDisk, addNIC } from '../../views/dialog';
import { actionButtons } from '../../views/selector';
import { tab } from '../../views/tab';
import { vm, waitForStatus } from '../../views/vm';

const nic1: Network = {
  name: 'nic-1',
  nad: NAD_NAME,
};
const disk1: Disk = {
  name: 'disk-1',
  size: '1',
};
const cloneVMName = `${TEST_VM.name}-clone1`;
const cloneNS = 'vm-clone-ns';

describe('Test VM Clone', () => {
  before(() => {
    cy.Login();

    // create auto-test-ns and auto-test-vm for all tests in this folder
    cy.deleteResource(K8S_KIND.VM, TEST_VM.name, TEST_NS);
    cy.deleteTestProject(cloneNS);
    cy.deleteTestProject(TEST_NS);
    cy.visit(`/k8s/cluster/projects`);
    cy.get('[data-test-id="default"]').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.text().includes(TEST_NS)) {
        console.log('auto-test-ns already exist');
      } else {
        cy.createProject(TEST_NS);
      }
    });
    cy.createProject(cloneNS);
    vm.create(TEST_VM);
    cy.cdiCloner(TEST_NS, cloneNS);
    cy.createNAD(TEST_NS);
    cy.visitVMsList();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, `${TEST_VM.name}-clone`, cloneNS);
    cy.deleteResource(K8S_KIND.VM, cloneVMName, TEST_VM.namespace);
    cy.deleteResource(K8S_KIND.NAD, NAD_NAME, TEST_NS);
    cy.deleteTestProject(cloneNS);
  });

  it('ID(CNV-1730) Displays warning in clone wizard when cloned VM is running', () => {
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.kebabButton);
    cy.get('.pf-c-alert__title')
      .contains(`The VM ${TEST_VM.name} is still running. It will be powered off while cloning.`)
      .should('exist');
    cy.get(cloneView.cancel).click();
  });

  it('ID(CNV-1863) Prefills correct data in the clone VM dialog', () => {
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.kebabButton);
    cy.get(cloneView.vmName).should('have.value', `${TEST_VM.name}-clone`);
    cy.get(cloneView.nameSpace).should('have.value', TEST_NS);
    cy.get(cloneView.cancel).click();
  });

  it('ID(CNV-3058) Clones VM to a different namespace', () => {
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.kebabButton);
    cy.get(cloneView.vmName).should('have.value', `${TEST_VM.name}-clone`);
    cy.get(cloneView.nameSpace)
      .select(cloneNS)
      .should('have.value', cloneNS);
    cy.get(cloneView.startOnClone).click();
    cy.get('#confirm-action').click();
  });

  it('ID(CNV-1732) Validates VM name', () => {
    cy.visitVMsList();
    cy.byLegacyTestID(TEST_VM.name)
      .should('exist')
      .click();
    tab.navigateToDetails();
    selectActionFromDropdown(VM_ACTION.Clone, actionButtons.actionDropdownButton);

    // Check warning is displayed when VM has same name as existing VM
    cy.get(cloneView.vmName)
      .clear()
      .type(TEST_VM.name)
      .should('have.value', TEST_VM.name);
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
    cy.byLegacyTestID(TEST_VM.name)
      .should('exist')
      .click();
    tab.navigateToDetails();
    waitForStatus(VM_STATUS.Stopped);
  });

  it('ID(CNV-1733) Start cloned VM on creation', () => {
    cy.visitVMsList();
    cy.selectProject(cloneNS);
    cy.byLegacyTestID(`${TEST_VM.name}-clone`)
      .should('exist')
      .click();
    tab.navigateToDetails();
    waitForStatus(VM_STATUS.Running);
  });

  it('ID(CNV-1734) Cloned VM has changed MAC address', () => {
    cy.visitVMsList();
    cy.byLegacyTestID(`${TEST_VM.name}-clone`)
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
    cy.selectProject(TEST_NS);
    cy.byLegacyTestID(TEST_VM.name)
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
    cy.selectProject(TEST_NS);
    cy.visitVMsList();
    cy.byLegacyTestID(TEST_VM.name)
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
    vm.stop(); // stop vm for next test
  });
});
