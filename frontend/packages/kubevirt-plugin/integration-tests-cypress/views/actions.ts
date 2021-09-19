import { actionButtons, modalCancel, modalConfirm, modalTitle } from './selector';

export const selectActionFromDropdown = (action: string, selector: string) => {
  cy.byLegacyTestID(selector).click();
  cy.contains(action).should('exist');
  cy.byTestActionID(action).click();
};

export const detailViewAction = (action) => {
  selectActionFromDropdown(action, actionButtons.actionDropdownButton);
  cy.get('body').then(($body) => {
    if ($body.find(modalTitle).length) {
      cy.get(modalConfirm).click();
      cy.get(modalCancel).should('not.exist');
    }
  });
};

export const listViewAction = (action) => {
  selectActionFromDropdown(action, actionButtons.kebabButton);
  cy.get('body').then(($body) => {
    if ($body.find(modalTitle).length) {
      cy.get(modalConfirm).click();
      cy.get(modalCancel).should('not.exist');
    }
  });
};
