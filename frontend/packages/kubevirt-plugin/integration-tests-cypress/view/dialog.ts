import { DISK_SOURCE } from '../const';
import { Disk, Network } from '../types/vm';
import { diskDialog, deleteDiskBtn, kebabBtn, nicDialog, disksTab } from './selector';
import { modalConfirmBtn } from './snapshot';

export const addNIC = (nic: Network) => {
  cy.get(nicDialog.addNIC).click();
  cy.get(nicDialog.nicName)
    .clear()
    .type(nic.name);
  if (nic.model) {
    cy.get(nicDialog.model).click();
    cy.get('.pf-c-select__menu-item-main')
      .contains(nic.model)
      .click();
  }
  cy.get(nicDialog.NAD)
    .select(nic.nad)
    .should('have.value', nic.nad);
  if (nic.type) {
    cy.get(nicDialog.nicType).click();
    cy.get('.pf-c-select__menu-item-main')
      .contains(nic.type)
      .click();
  }
  cy.get(nicDialog.add).click();
};

export const addDisk = (disk: Disk) => {
  cy.get(disksTab.addDiskBtn).click();
  if (disk.source) {
    cy.get(diskDialog.source).click();
    cy.get('.pf-c-select__menu-item-main')
      .contains(disk.source)
      .click();
    const sourceUrl = disk.provisionSource ? disk.provisionSource.getValue() : '';
    switch (disk.source) {
      case DISK_SOURCE.Url:
        if (sourceUrl) {
          cy.get(diskDialog.diskURL).type(sourceUrl);
        } else {
          throw new Error('No `disk.provisionSource` provided!!!');
        }
        break;
      case DISK_SOURCE.Container:
        if (sourceUrl) {
          cy.get(diskDialog.diskContainer).type(sourceUrl);
        } else {
          throw new Error('No `disk.provisionSource` provided!!!');
        }
        break;
      case DISK_SOURCE.AttachDisk:
      case DISK_SOURCE.AttachClonedDisk:
        cy.get(diskDialog.diskPVC).select(disk.pvcName);
        break;
      case DISK_SOURCE.EphemeralContainer:
      case DISK_SOURCE.Blank:
        break;
      default:
    }
  }
  cy.get(diskDialog.diskName)
    .clear()
    .type(disk.name);
  if (disk.size) {
    cy.get(diskDialog.size).type(disk.size);
  }
  if (disk.drive) {
    cy.get(diskDialog.diskType)
      .select(disk.drive)
      .should('have.value', disk.drive);
  }
  if (disk.interface) {
    cy.get(diskDialog.diskInterface).click();
    cy.get('.pf-c-select__menu-item-main')
      .contains(disk.interface)
      .click();
  }
  if (Cypress.env('STORAGE_CLASS')) {
    cy.get(diskDialog.storageClass).click();
    cy.get(`#${Cypress.env('STORAGE_CLASS')}-link`).click({ force: true });
  }
  if (disk.preallocation) {
    cy.contains('Enable preallocation').click();
  }
  if (disk.autoDetach === true) {
    cy.get(diskDialog.autoDetach)
      .check()
      .should('be.checked');
  } else if (disk.autoDetach === false) {
    cy.get(diskDialog.autoDetach)
      .uncheck()
      .should('not.be.checked');
  }
  cy.get(diskDialog.add).click();
};

export const delDisk = (name: string) => {
  cy.get(`[data-id="${name}"] ${kebabBtn}`).click();
  cy.get(deleteDiskBtn).click();
  cy.get(modalConfirmBtn).click();
};
