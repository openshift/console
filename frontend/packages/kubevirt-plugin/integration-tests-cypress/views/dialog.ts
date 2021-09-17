import { Disk, Network } from '../types/vm';
import { diskDialog, nicDialog } from './selector';

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
  cy.byDataID(nic.name).should('exist');
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
    cy.get('body').then(($body) => {
      if ($body.find(diskDialog.storageClass).length) {
        cy.get(diskDialog.storageClass).click();
        cy.get(`#${Cypress.env('STORAGE_CLASS')}-link`).click({ force: true });
      }
    });
  }
  if (disk.preallocation) {
    cy.contains('Enable preallocation').click();
  }
  cy.get(diskDialog.add).click();
  cy.byDataID(disk.name).should('exist');
};

export const deleteRow = (rowID: string) => {
  cy.byDataID(rowID).should('exist');
  cy.byDataID(rowID)
    .find('[data-test-id="kebab-button"]')
    .click();
  cy.byTestActionID('Delete').click();
  cy.byTestID('confirm-action').click();
  cy.byDataID(rowID).should('not.exist');
};
