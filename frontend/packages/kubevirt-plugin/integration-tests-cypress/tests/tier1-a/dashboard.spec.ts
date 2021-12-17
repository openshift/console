import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import {
  DEFAULT_VALUES,
  K8S_KIND,
  TEMPLATE,
  VM_ACTION,
  VM_ACTION_TIMEOUT,
  VM_STATUS,
  YAML_VM_NAME,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { detailViewAction } from '../../views/actions';
import { dashboardTab, resourceStatus } from '../../views/selector';
import { vm } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `test-vm-details-${testName}`,
  description: 'rhel8 vm for details',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: true,
  startOnCreation: true,
};

describe('Test VM dashboard tab', () => {
  before(() => {
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.visitVMsList();
  });

  after(() => {
    cy.deleteTestProject(testName);
  });

  describe('Test VM dashboard which has no guest agent installed', () => {
    before(() => {
      vm.create(vmData);
    });

    after(() => {
      cy.deleteResource(K8S_KIND.VM, vmData.name, vmData.namespace);
    });

    it('ID(CNV-3332) Guest agent required shows in dashboard tab ', () => {
      cy.byLegacyTestID(vmData.name)
        .should('exist')
        .click();

      cy.get(dashboardTab.detailsCardItem)
        .eq(3)
        .should('contain', DEFAULT_VALUES.GUEST_AGENT_REQUIRED); // Hostname
      cy.get(dashboardTab.detailsCardItem)
        .eq(7)
        .should('contain', DEFAULT_VALUES.GUEST_AGENT_REQUIRED); // Time Zone
      cy.get(dashboardTab.detailsCardItem)
        .eq(8)
        .should('contain', DEFAULT_VALUES.GUEST_AGENT_REQUIRED); // Active Users
    });
  });

  describe('Test VM dashboard which has guest agent installed', () => {
    before(() => {
      cy.createDefaultVM();
    });

    after(() => {
      cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    });

    it('ID(CNV-3331) Check VM dashboard while VM is off', () => {
      // status icon
      cy.get(resourceStatus).should('contain', VM_STATUS.Stopped);

      // Details card
      cy.get(dashboardTab.detailsCardItem)
        .eq(0)
        .should('contain', YAML_VM_NAME);
      cy.get(dashboardTab.detailsCardItem)
        .eq(1)
        .should('contain', testName);
      cy.get(dashboardTab.detailsCardItem)
        .eq(3)
        .should('contain', DEFAULT_VALUES.VM_NOT_RUNNING); // Hostname
      cy.get(dashboardTab.detailsCardItem)
        .eq(4)
        .should('contain', DEFAULT_VALUES.NOT_AVAILABLE); // Node
      cy.get(dashboardTab.detailsCardItem)
        .eq(5)
        .should('contain', DEFAULT_VALUES.NOT_AVAILABLE); // IP Address
      cy.get(dashboardTab.detailsCardItem)
        .eq(6)
        .should('contain', TEMPLATE.RHEL8.os); // OS
      cy.get(dashboardTab.detailsCardItem)
        .eq(7)
        .should('contain', DEFAULT_VALUES.VM_NOT_RUNNING); // Time Zone
      cy.get(dashboardTab.detailsCardItem)
        .eq(8)
        .should('contain', DEFAULT_VALUES.VM_NOT_RUNNING); // Active Users

      // Status card
      cy.get(dashboardTab.vmHealth).should('contain', VM_STATUS.Stopped);
      cy.get(dashboardTab.guestAgentHealth).should('contain', DEFAULT_VALUES.VM_NOT_RUNNING);

      // Utilization card
      cy.get(dashboardTab.utilsCardItem)
        .eq(0)
        .should('contain', DEFAULT_VALUES.NOT_AVAILABLE);
      cy.get(dashboardTab.utilsCardItem)
        .eq(1)
        .should('contain', DEFAULT_VALUES.NOT_AVAILABLE);
      cy.get(dashboardTab.utilsCardItem)
        .eq(2)
        .should('contain', DEFAULT_VALUES.NOT_AVAILABLE);
      cy.get(dashboardTab.utilsCardItem)
        .eq(3)
        .should('contain', DEFAULT_VALUES.NOT_AVAILABLE);

      // Inventory card
      cy.get(dashboardTab.inventoryCardItem)
        .eq(0)
        .should('contain', '1 NIC');
      cy.get(dashboardTab.inventoryCardItem)
        .eq(1)
        .should('contain', '2 Disks');

      // Events card
      cy.get(dashboardTab.eventsCardBody).should('not.exist');
    });

    it('ID(CNV-3332) Check VM dashboard while VM is running', () => {
      // make it downstream only as VMs created from yaml have guest agent enabled
      if (Cypress.env('DOWNSTREAM')) {
        detailViewAction(VM_ACTION.Start);

        // Status card
        cy.contains(dashboardTab.vmHealth, VM_STATUS.Starting, {
          timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
        }).should('exist');
        cy.contains(dashboardTab.vmHealth, VM_STATUS.Running, {
          timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
        }).should('exist');
        cy.get(dashboardTab.guestAgentOK, { timeout: 180000 }).should('exist');

        // status icon
        cy.get(resourceStatus).should('contain', VM_STATUS.Running);

        // Details card
        cy.get(dashboardTab.detailsCardItem)
          .eq(0)
          .should('contain', YAML_VM_NAME);
        cy.get(dashboardTab.detailsCardItem)
          .eq(1)
          .should('contain', testName);
        cy.get(dashboardTab.detailsCardItem)
          .eq(3)
          .should('contain', YAML_VM_NAME); // Hostname
        cy.get(dashboardTab.detailsCardItem)
          .eq(4)
          .should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE); // Node
        cy.get(dashboardTab.detailsCardItem)
          .eq(5)
          .should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE); // IP Address
        cy.get(dashboardTab.detailsCardItem)
          .eq(6)
          .should('contain', 'Red Hat Enterprise Linux'); // OS
        cy.get(dashboardTab.detailsCardItem)
          .eq(7)
          .should('not.contain', DEFAULT_VALUES.GUEST_AGENT_REQUIRED); // Time Zone
        cy.get(dashboardTab.detailsCardItem)
          .eq(8)
          .should('contain', 'No users logged in'); // Active Users

        // Utilization card
        cy.get(dashboardTab.utilsCardItem)
          .eq(0)
          .should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE);
        cy.get(dashboardTab.utilsCardItem)
          .eq(1)
          .should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE);
        cy.get(dashboardTab.utilsCardItem)
          .eq(2)
          .should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE);
        cy.get(dashboardTab.utilsCardItem)
          .eq(3)
          .should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE);

        // Inventory card
        cy.get(dashboardTab.inventoryCardItem)
          .eq(0)
          .should('contain', '1 NIC');
        cy.get(dashboardTab.inventoryCardItem)
          .eq(1)
          .should('contain', '2 Disks');

        // Events card
        cy.get(dashboardTab.eventsCardBody).should('exist');
      }
    });
  });
});
