export const listViewKebabDropdown = 'kebab-button';
export const detailViewDropdown = 'actions-menu-button';
export const detailViewDropdownMenu = 'action-items';
export const modalTitle = '[data-test-id="modal-title"]';
export const confirmButton = '[data-test="confirm-action"]';
export const confirmCloneButton = 'button[id="confirm-action"]';
export const kebabButton = 'kebab-button';

export const selectItemFromDropdown = (action: string, selector: string) => {
  cy.byLegacyTestID(selector).click();
  cy.byLegacyTestID(selector).should('be.visible');
  cy.byTestActionID(action).click();
};

export const detailViewAction = (action) => {
  selectItemFromDropdown(action, detailViewDropdown);
  cy.get('body').then(($body) => {
    if ($body.find(modalTitle).length) {
      cy.get(confirmButton).click();
    }
  });
};

export const listViewAction = (action) => {
  selectItemFromDropdown(action, kebabButton);
  cy.get('body').then(($body) => {
    if ($body.find(modalTitle).length) {
      cy.get(confirmButton).click();
    }
  });
};
