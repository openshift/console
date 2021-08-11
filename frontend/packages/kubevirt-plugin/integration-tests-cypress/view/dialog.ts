/* eslint-disable @typescript-eslint/no-use-before-define */
import { DISK_SOURCE, VM_ACTION_TIMEOUT } from '../const';
import { Disk, Network } from '../types/vm';
import { diskDialog, nicDialog, kebabBtn, deleteDiskBtn, disksTab } from './selector';
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
  cy.get(disksTab.addDisk).click();
  if (disk.source) {
    cy.get(diskDialog.source).click();
    cy.get('.pf-c-select__menu-item-main')
      .contains(disk.source)
      .click();
  }
  cy.get(diskDialog.diskName)
    .clear()
    .type(disk.name);
  cy.get(diskDialog.size).type(disk.size);
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
  if (disk.source === DISK_SOURCE.Url) {
    if (disk.url) {
      cy.get(diskDialog.sourceURL).type(disk.url);
    } else {
      throw new Error('No value for `disk.url` provided!!!');
    }
  } else if (disk.source === DISK_SOURCE.Container) {
    if (disk.url) {
      cy.get(diskDialog.container).type(disk.url);
    } else {
      throw new Error('No value for `disk.url` provided!!!');
    }
  } else if (
    disk.source === DISK_SOURCE.AttachDisk ||
    disk.source === DISK_SOURCE.AttachClonedDisk
  ) {
    if (disk.pvc) {
      cy.get(diskDialog.diskPVC)
        .select(disk.pvc)
        .should('have.value', disk.pvc);
    } else {
      throw new Error('No value for `disk.pvc` provided!!!');
    }
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

export const waitForCurrentVMStatus = (status: string, timeout?: number) => {
  const timeOut = timeout || VM_ACTION_TIMEOUT.VM_IMPORT;
  cy.contains(disksTab.currVMStatus, status, { timeout: timeOut }).should('exist');
};
