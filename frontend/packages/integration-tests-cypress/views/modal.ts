import { submitButton } from './form';

export const modal = {
  shouldBeOpened: () => cy.byLegacyTestID('modal-cancel-action').should('be.visible'),
  shouldBeClosed: () => cy.byLegacyTestID('modal-cancel-action').should('not.be.visible'),
  submitShouldBeDisabled: () => cy.get(submitButton).should('be', 'disabled'),
  submitShouldBeEnabled: () => cy.get(submitButton).should('not.be', 'disabled'),
  submit: () => cy.get(submitButton).click(),
};
