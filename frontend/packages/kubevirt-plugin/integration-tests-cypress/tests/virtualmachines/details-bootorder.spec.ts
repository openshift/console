import { testName } from '../../support';
import { K8S_KIND, YAML_VM_NAME } from '../../utils/const/index';
import { detailsTab, modalConfirm, modalTitle, pendingChangeAlert } from '../../views/selector';
import {
  addSource,
  selectDevice,
  draggablePointer,
  deletePointer,
} from '../../views/selector-tabs';
import { tab } from '../../views/tab';
import { vm } from '../../views/vm';

enum bootDevices {
  containerDisk = 'containerdisk (Disk)',
  cloudinitDisk = 'cloudinitdisk (Disk)',
  defaultNIC = 'default (NIC)',
}

describe('Test VM details tab', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    cy.visitVMsList();
    cy.createDefaultVM();
    tab.navigateToDetails();
    vm.start();
  });

  after(() => {
    cy.deleteResource(K8S_KIND.VM, YAML_VM_NAME, testName);
    cy.deleteTestProject(testName);
  });

  it('ID(CNV-3550) Displays boot devices', () => {
    cy.get(detailsTab.vmBootOrder)
      .find('li')
      .first()
      .should('contain', bootDevices.containerDisk);
  });

  it('ID(CNV-3548) Adds bootable device', () => {
    cy.get('[data-test="boot-order-details-item"]')
      .find(detailsTab.vmEditWithPencil)
      .click();
    cy.get(addSource).click();
    cy.get(selectDevice).select(bootDevices.defaultNIC);
    cy.get(modalConfirm).click();
    cy.get(modalTitle).should('not.exist');
    cy.contains(bootDevices.defaultNIC).should('exist');
    cy.get(detailsTab.vmBootOrder)
      .find('li')
      .eq(0)
      .should('contain', bootDevices.containerDisk);
    cy.get(detailsTab.vmBootOrder)
      .find('li')
      .eq(1)
      .should('contain', bootDevices.defaultNIC);
  });

  it('ID(CNV-5328) Pending Changes shows when Boot-Order changes', () => {
    cy.get(pendingChangeAlert).should('contain', 'Boot Order');
  });

  it('ID(CNV-3547) Drags and drops to change boot order', () => {
    cy.get('[data-test="boot-order-details-item"]')
      .find(detailsTab.vmEditWithPencil)
      .click();

    const dataTransfer = new DataTransfer();
    cy.get(draggablePointer)
      .eq(0)
      .trigger('dragstart', { dataTransfer });

    cy.get(draggablePointer)
      .eq(1)
      .trigger('drop')
      .trigger('dragend', { dataTransfer });

    cy.get(modalConfirm).click();
    cy.get(modalTitle).should('not.exist');
    cy.reload(); // ensure page is refreshed
    cy.contains(bootDevices.defaultNIC).should('exist');
    cy.get(detailsTab.vmBootOrder)
      .find('li')
      .eq(0)
      .should('contain', bootDevices.defaultNIC);
  });

  it('ID(CNV-3549) Deletes bootable device', () => {
    cy.get('[data-test="boot-order-details-item"]')
      .find(detailsTab.vmEditWithPencil)
      .click();
    cy.get(deletePointer)
      .eq(0)
      .click(); // delete nic
    cy.get(modalConfirm).click();
    cy.get(modalTitle).should('not.exist');
    cy.reload(); // ensure page is refreshed
    cy.contains(bootDevices.containerDisk).should('exist');
    cy.contains(bootDevices.defaultNIC).should('not.exist');
  });
});
