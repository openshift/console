export const listViewKebabDropdown = 'kebab-button';
export const detailViewDropdown = 'actions-menu-button';
export const detailViewDropdownMenu = 'action-items';
export const modalTitle = '[data-test-id="modal-title"]';
export const confirmButton = '[data-test="confirm-action"]';
export const confirmCloneButton = 'button[id="confirm-action"]';

export const selectDropdownItem = (action: string) => {
  cy.byLegacyTestID(detailViewDropdown).click();
  cy.byLegacyTestID(detailViewDropdown).should('be.visible');
  cy.byTestActionID(action).click();
};

export const detailViewAction = (action) => {
  selectDropdownItem(action);
  cy.get('body').then(($body) => {
    if ($body.find(modalTitle).length) {
      cy.get(confirmButton).click();
    }
  });
};
