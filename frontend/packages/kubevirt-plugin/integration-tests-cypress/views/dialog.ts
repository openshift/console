import { Disk, Network } from '../types/vm';
import { ProvisionSource } from '../utils/const/provisionSource';
import { diskDialog, nicDialog, menuItemMain, modalCancel, disksTab } from './selector';
import { dropDownItemLink } from './selector-wizard';

export const addNIC = (nic: Network) => {
  cy.get(nicDialog.addNIC).click();
  cy.get(nicDialog.nicName)
    .clear()
    .type(nic.name);
  if (nic.model) {
    cy.get(nicDialog.model).click();
    cy.get(menuItemMain)
      .contains(nic.model)
      .click();
  }
  cy.get(nicDialog.NAD)
    .select(nic.nad)
    .should('have.value', nic.nad);
  if (nic.type) {
    cy.get(nicDialog.nicType).click();
    cy.get(menuItemMain)
      .contains(nic.type)
      .click();
  }
  cy.get(nicDialog.add).click();
  cy.byDataID(nic.name).should('exist');
};

export const addDisk = (disk: Disk) => {
  cy.get(disksTab.addDiskBtn).click();
  if (disk.source) {
    cy.get(diskDialog.source).click();
    cy.get(menuItemMain)
      .contains(disk.source.getDescription())
      .click();
    const sourceURL = disk.source.getSource();
    switch (disk.source) {
      case ProvisionSource.URL:
        if (sourceURL) {
          cy.get(diskDialog.diskURL).type(sourceURL);
        } else {
          throw new Error('No `disk.source value` provided!!!');
        }
        break;
      case ProvisionSource.REGISTRY:
      case ProvisionSource.EPHEMERAL:
        if (sourceURL) {
          cy.get(diskDialog.diskContainer).type(sourceURL);
        } else {
          throw new Error('No `disk.source value` provided!!!');
        }
        break;
      case ProvisionSource.EXISTING:
      case ProvisionSource.CLONE_PVC:
        cy.get(diskDialog.diskPVC).select(disk.pvcName);
        break;
      case ProvisionSource.BLANK:
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
    cy.get(menuItemMain)
      .contains(disk.interface)
      .click();
  }
  if (Cypress.env('STORAGE_CLASS')) {
    cy.get('body').then(($body) => {
      if ($body.find(diskDialog.storageClass).length) {
        cy.get(diskDialog.storageClass).click();
        cy.get(dropDownItemLink)
          .contains(Cypress.env('STORAGE_CLASS'))
          .click();
        cy.contains('Access mode').should('exist');
      }
    });
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
  cy.get(modalCancel).should('not.exist');
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
