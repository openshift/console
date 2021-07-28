import {
  DEFAULTS_VALUES,
  VM_ACTION,
  VM_ACTION_TIMEOUT,
  VM_STATUS,
  OS_IMAGES_NS,
  TEMPLATE_NAME,
  TEMPLATE_BASE_IMAGE,
} from '../../const/index';
import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import {
  detailViewAction,
  detailViewDropdown,
  modalTitle,
  selectActionFromDropdown,
} from '../../view/actions';
import { alertTitle, confirmCloneButton } from '../../view/clone';
import {
  switchPerspective,
  Perspective,
  addHeader,
  topologyHeader,
} from '../../view/dev-perspective';
import { detailsTab } from '../../view/selector';
import { waitForStatus } from '../../view/vm';

const vm: VirtualMachineData = {
  name: `smoke-test-vm-${testName}`,
  namespace: testName,
};

describe('test dev console', () => {
  before(() => {
    cy.viewport(1536, 960);
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.cdiCloner(testName, OS_IMAGES_NS);
    cy.createDataVolume(TEMPLATE_BASE_IMAGE, OS_IMAGES_NS);
  });

  after(() => {
    cy.deleteResource({
      kind: 'DataVolume',
      metadata: {
        name: TEMPLATE_BASE_IMAGE,
        namespace: OS_IMAGES_NS,
      },
    });
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vm.name,
        namespace: vm.namespace,
      },
    });
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: `${vm.name}-clone`,
        namespace: testName,
      },
    });
    switchPerspective(Perspective.Administrator);
  });

  describe('switch perspective', () => {
    it('switch from admin to dev perspective', () => {
      switchPerspective(Perspective.Developer);
      cy.byLegacyTestID(addHeader).should('exist');
      cy.byLegacyTestID(topologyHeader).should('exist');
    });
  });

  describe('create vm in dev console', () => {
    it('ID(CNV-5699) create virtual machine', () => {
      cy.byLegacyTestID(addHeader).click();
      cy.get('[data-test="item dev-catalog-virtualization"]').click();
      cy.contains(TEMPLATE_NAME)
        .should('be.visible')
        .click();
      cy.contains('Create from template').click({ force: true });
      cy.viewport(1536, 960);
      cy.get('input[id="vm-name"]')
        .clear()
        .type(vm.name);
      cy.get('#ssh-service-checkbox').click();
      cy.get('button[type="submit"]').click();
      cy.get('button[type="submit"]').should('not.exist');
    });
  });

  describe('review vm tabs', () => {
    after(() => {
      cy.get('button[type="button"]')
        .contains('Details')
        .click();
    });

    it('ID(CNV-5700) review details tab', () => {
      cy.byLegacyTestID('base-node-handler').click();
      cy.get('.odc-resource-icon-virtualmachine').click();

      waitForStatus(VM_STATUS.Running, vm, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);

      cy.get(detailsTab.vmPod).should('not.contain', DEFAULTS_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmIP).should('not.contain', DEFAULTS_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmNode).should('not.contain', DEFAULTS_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmTemplate).should('contain', TEMPLATE_BASE_IMAGE);
    });

    it('ID(CNV-5701) review resources tab', () => {
      // navigate to resource tab
      cy.get('button[type="button"]')
        .contains('Resources')
        .click();

      // check pod status is running in this tab
      cy.get(detailsTab.vmStatus).should('contain', VM_STATUS.Running);
    });
  });

  describe('vm actions in devconsole', () => {
    beforeEach(() => {
      cy.byLegacyTestID(topologyHeader).click();
      cy.byLegacyTestID('base-node-handler').click();
    });

    it('ID(CNV-5702) restart vm', () => {
      waitForStatus(VM_STATUS.Running, vm, VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP);

      detailViewAction(VM_ACTION.Restart);
      waitForStatus(VM_STATUS.Starting, vm, VM_ACTION_TIMEOUT.VM_BOOTUP);
      waitForStatus(VM_STATUS.Running, vm, VM_ACTION_TIMEOUT.VM_BOOTUP);
    });

    it('ID(CNV-5702) stop vm', () => {
      detailViewAction(VM_ACTION.Stop);
      waitForStatus(VM_STATUS.Off, vm, VM_ACTION_TIMEOUT.VM_BOOTUP);
    });

    it('ID(CNV-5702) start vm', () => {
      detailViewAction(VM_ACTION.Start);
      waitForStatus(VM_STATUS.Running, vm, VM_ACTION_TIMEOUT.VM_BOOTUP);
    });

    it('ID(CNV-5702) migrate vm', () => {
      if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
        detailViewAction(VM_ACTION.Migrate);
        waitForStatus(VM_STATUS.Migrating, vm, VM_ACTION_TIMEOUT.VM_BOOTUP);
        waitForStatus(VM_STATUS.Running, vm, VM_ACTION_TIMEOUT.VM_BOOTUP);
      }
    });

    it('ID(CNV-5702) clone vm', () => {
      selectActionFromDropdown(VM_ACTION.Clone, detailViewDropdown);
      cy.get(modalTitle)
        .contains('Clone Virtual Machine')
        .should('exist');
      cy.get(alertTitle).should('be.visible');
      cy.get(confirmCloneButton).click();

      // delete origin VM
      waitForStatus(VM_STATUS.Off, vm, VM_ACTION_TIMEOUT.VM_BOOTUP);
      detailViewAction(VM_ACTION.Delete);

      cy.byLegacyTestID('base-node-handler').should('have.length', 1);
    });

    // delete cloned vm
    it('ID(CNV-5702) delete vm', () => {
      detailViewAction(VM_ACTION.Delete);
      cy.get('.odc-topology__empty-state')
        .should('be.visible')
        .contains('No resources found');
    });
  });
});
