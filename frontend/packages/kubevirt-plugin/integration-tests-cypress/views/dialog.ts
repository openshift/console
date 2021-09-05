import { Disk, Network } from '../types/vm';
import { ProvisionSource } from '../utils/const/provisionSource';
import { diskDialog, nicDialog, kebabBtn, deleteDiskBtn, modalConfirm } from './selector';

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
  cy.get(diskDialog.addDisk).click();
  if (disk.source) {
    cy.get(diskDialog.source).click();
    cy.get('.pf-c-select__menu-item-main')
      .contains(disk.source.getDescription())
      .click();
    cy.get('body').then(($body) => {
      if ($body.find(diskDialog.diskURL).length) {
        cy.get(diskDialog.diskURL)
          .clear()
          .type(disk.source.getSource());
      }
      if ($body.find(diskDialog.diskContainer).length) {
        cy.get(diskDialog.diskContainer)
          .clear()
          .type(disk.source.getSource());
      }
    });
  }
  const sourceUrl = disk.source ? disk.source.getValue() : '';
  switch (disk.source) {
    case ProvisionSource.URL:
      if (sourceUrl) {
        cy.get(diskDialog.diskURL).type(sourceUrl);
      } else {
        throw new Error('No `disk.source` provided!!!');
      }
      break;
    case ProvisionSource.REGISTRY:
      if (sourceUrl) {
        cy.get(diskDialog.diskContainer).type(sourceUrl);
      } else {
        throw new Error('No `disk.source` provided!!!');
      }
      break;
    case ProvisionSource.EXISTING:
    case ProvisionSource.CLONE_PVC:
      cy.get(diskDialog.diskPVC).select(disk.pvcName);
      break;
    case ProvisionSource.EPHEMERAL:
    case ProvisionSource.BLANK:
      break;
    default:
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
  cy.get(modalConfirm).click();
};
