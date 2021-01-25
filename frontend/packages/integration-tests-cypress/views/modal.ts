import { submitButton } from './form';

export const modal = {
  shouldBeOpened: () => cy.byLegacyTestID('modal-cancel-action').should('be.visible'),
  shouldBeClosed: () => cy.byLegacyTestID('modal-cancel-action').should('not.exist'),
  submitShouldBeDisabled: () => cy.get(submitButton).should('be.disabled'),
  submitShouldBeEnabled: () => cy.get(submitButton).should('not.be.disabled'),
  cancel: (force: boolean = false) => cy.byLegacyTestID('modal-cancel-action').click({ force }),
  submit: (force: boolean = false) => cy.get(submitButton).click({ force }),
  modalTitleShouldContain: (modalTitle: string) =>
    cy.byLegacyTestID('modal-title').should('contain.text', modalTitle),
};
