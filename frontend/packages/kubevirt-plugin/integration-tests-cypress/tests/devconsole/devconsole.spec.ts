import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import {
  DEFAULT_VALUES,
  K8S_KIND,
  OS_IMAGES_NS,
  TEMPLATE,
  VM_ACTION,
  VM_STATUS,
} from '../../utils/const/index';
import { detailViewAction, selectActionFromDropdown } from '../../views/actions';
import { alertTitle, confirmCloneButton } from '../../views/clone';
import {
  addHeader,
  Perspective,
  switchPerspective,
  topologyHeader,
} from '../../views/dev-perspective';
import { actionButtons, detailsTab, modalTitle } from '../../views/selector';
import { waitForStatus } from '../../views/vm';

const template = TEMPLATE.RHEL6;

const vm: VirtualMachineData = {
  name: `smoke-test-vm-${testName}`,
  namespace: testName,
};

const cloneVMName = `${vm.name}-clone`;

describe('test dev console', () => {
  before(() => {
    cy.viewport(1536, 960);
    cy.Login();
    cy.visit('/');
    cy.createProject(testName);
    cy.cdiCloner(testName, OS_IMAGES_NS);
    cy.createDataVolume(template.dvName, OS_IMAGES_NS);
  });

  after(() => {
    cy.deleteResource(K8S_KIND.DV, template.dvName, OS_IMAGES_NS);
    cy.deleteResource(K8S_KIND.VM, vm.name, vm.namespace);
    cy.deleteResource(K8S_KIND.VM, cloneVMName, testName);
    cy.deleteTestProject(testName);

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
      cy.contains(template.name)
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
    it('ID(CNV-5700) review details tab', () => {
      cy.byLegacyTestID('base-node-handler').click();
      cy.get('.odc-resource-icon-virtualmachine').click();
      cy.get('.co-m-horizontal-nav__menu-item')
        .contains('Details')
        .click();

      waitForStatus(VM_STATUS.Running);

      cy.get(detailsTab.vmPod).should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmIP).should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmNode).should('not.contain', DEFAULT_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmTemplate).should('contain', template.dvName);
    });

    it('ID(CNV-5701) review resources tab', () => {
      // navigate to resource tab
      cy.get('.co-m-horizontal-nav__menu-item')
        .contains('Resources')
        .click();

      // check pod status is running in this tab
      cy.get(detailsTab.vmStatus).should('contain', VM_STATUS.Running);
    });
  });

  describe('vm actions in devconsole', () => {
    beforeEach(() => {
      cy.byLegacyTestID(addHeader).click();
      cy.byLegacyTestID(topologyHeader).click();
      cy.byLegacyTestID('base-node-handler').click();
    });

    it('ID(CNV-5702) restart vm', () => {
      cy.get('.co-m-horizontal-nav__menu-item')
        .contains('Details')
        .click();
      waitForStatus(VM_STATUS.Running);

      detailViewAction(VM_ACTION.Restart);
      waitForStatus(VM_STATUS.Starting);
      waitForStatus(VM_STATUS.Running);
    });

    it('ID(CNV-5702) stop vm', () => {
      detailViewAction(VM_ACTION.Stop);
      waitForStatus(VM_STATUS.Stopped);
    });

    it('ID(CNV-5702) start vm', () => {
      detailViewAction(VM_ACTION.Start);
      waitForStatus(VM_STATUS.Running);
    });

    it('ID(CNV-5702) migrate vm', () => {
      if (Cypress.env('STORAGE_CLASS') === 'ocs-storagecluster-ceph-rbd') {
        waitForStatus(VM_STATUS.Running);
        detailViewAction(VM_ACTION.Migrate);
        waitForStatus(VM_STATUS.Migrating);
        waitForStatus(VM_STATUS.Running);
      }
    });

    it('ID(CNV-5702) clone vm', () => {
      selectActionFromDropdown(VM_ACTION.Clone, actionButtons.actionDropdownButton);
      cy.get(modalTitle)
        .contains('Clone Virtual Machine')
        .should('exist');
      cy.get(alertTitle).should('be.visible');
      cy.get(confirmCloneButton).click();

      // delete origin VM
      waitForStatus(VM_STATUS.Stopped);
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
