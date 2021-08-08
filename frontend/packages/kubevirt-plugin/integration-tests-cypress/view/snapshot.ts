export const takeSnapshotBtn = 'button[id="add-snapshot"]';
export const saveBtn = 'button[data-test="confirm-action"]';
export const cancelBtn = 'button=[data-test="modal-cancel-action"]';
export const snapshotName = 'input[id="snapshot-name"]';
export const approveCheckbox = 'input[id="approve-checkbox"]';
export const kebabBtn = 'button[data-test-id="kebab-button"]';
export const deleteBtn = 'button[data-test-action="Delete VirtualMachineSnapshot"]';
export const modalConfirmBtn = 'button[data-test="confirm-action"]';
export const modalCancelBtn = 'button[data-test="modal-cancel-action"]';

export const snapshotRow = (name: string) => `[data-test-id="${name}]"`;
export const status = (name: string) => `td[id="${name}-snapshot-status"]`;
export const lastRestored = (name: string) => `td[id="${name}-restore-time"]`;
export const restoreBtn = (name: string) => `button[id="${name}-restore-btn"]`;

export const takeSnapshot = (name: string) => {
  cy.get(takeSnapshotBtn).click();
  cy.get(snapshotName)
    .clear()
    .type(name);
  cy.get(approveCheckbox).click();
  cy.get(saveBtn).click();
};

export const restoreSnapshot = (name: string) => {
  cy.get(restoreBtn(name)).click();
  cy.get(modalConfirmBtn).click();
};

export const deleteSnapshot = () => {
  cy.get(kebabBtn).click();
  cy.get(deleteBtn).click();
  cy.get(modalConfirmBtn).click();
};

export const warningNoDisksFound = () => {
  cy.get(takeSnapshotBtn).click();
  cy.get('.pf-c-alert__title')
    .contains('No disks found to include in the snapshot')
    .should('be.visible');
  cy.get(saveBtn).should('be.disabled');
  cy.get(modalCancelBtn).click();
};
