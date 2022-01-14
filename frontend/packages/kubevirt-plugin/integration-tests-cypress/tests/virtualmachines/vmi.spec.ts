import vmiFixture from '../../fixtures/vmi-ephemeral';
import { testName } from '../../support';
import {
  K8S_KIND,
  VM_ACTION_TIMEOUT,
  VM_STATUS,
  VMI_ACTION,
  YAML_VM_NAME,
} from '../../utils/const/index';
import { clearFilters } from '../../utils/const/string';
import { detailViewAction } from '../../views/actions';
import { dashboardTab, filterBtn, filterStatus, nameFilter, nicDialog } from '../../views/selector';
import { tab } from '../../views/tab';

const vmiName = 'vmi-ephemeral';

describe('Test VMI', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    vmiFixture.metadata.namespace = testName;
    cy.createResource(vmiFixture);
    cy.visitVMsList();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VMI, vmiName, testName);
    cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    cy.deleteTestProject(testName);
  });

  describe('Test VMI details', () => {
    before(() => {
      cy.byLegacyTestID(vmiName)
        .should('exist')
        .click();
    });

    it('ID(CNV-4089) VMI status is running', () => {
      cy.contains(dashboardTab.vmHealth, VM_STATUS.Running, {
        timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
      }).should('exist');
    });

    it('ID(CNV-4042) VMI network tab', () => {
      tab.navigateToNetwork();
      cy.contains(nicDialog.addNIC).should('not.exist');
      cy.byLegacyTestID('kebab-button').should('be.disabled');
    });

    it('ID(CNV-4041) VMI disk tab', () => {
      tab.navigateToDisk();
      // TODO: enable below test once the 'Add Disk' is removed
      // cy.contains(diskDialog.addDisk).should('not.exist');
      cy.byLegacyTestID('kebab-button').should('be.disabled');
    });
  });

  describe('Test filter on VMs list view with VMI', () => {
    before(() => {
      cy.visitVMsList();
      cy.createDefaultVM();
      cy.visitVMsList();
    });

    after(() => {
      cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    });

    it('ID(CNV-3700) Filter VM/VMI by status', () => {
      cy.get(filterBtn).click();
      cy.get(filterStatus(VM_STATUS.Running)).click();
      cy.get(nameFilter).click();
      cy.byLegacyTestID(YAML_VM_NAME).should('not.exist');
      cy.byLegacyTestID(vmiName).should('exist');
      cy.contains(clearFilters).click({ force: true });

      cy.get(filterBtn).click();
      cy.get(filterStatus(VM_STATUS.Stopped)).click();
      cy.get(nameFilter).click();
      cy.byLegacyTestID(YAML_VM_NAME).should('exist');
      cy.byLegacyTestID(vmiName).should('not.exist');
      cy.contains(clearFilters).click({ force: true });
    });
  });

  describe('Delete VMI', () => {
    before(() => {
      cy.visitVMsList();
      cy.byLegacyTestID(vmiName)
        .should('exist')
        .click();
    });

    it('ID(CNV-3699) Delete VMI', () => {
      detailViewAction(VMI_ACTION.Delete);
      cy.visitVMsList();
      cy.byTestID('create-vm-empty').should('be.visible');
    });
  });
});
