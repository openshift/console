export const warningModal = {
  shouldBeOpened: (ouiaId: string) => {
    cy.get(`[data-ouia-component-id="${ouiaId}"]`, { timeout: 20000 }).should('be.visible');
  },
  shouldBeClosed: (ouiaId: string) => {
    cy.get(`[data-ouia-component-id="${ouiaId}"]`).should('not.exist');
  },
  cancel: (ouiaId: string, force: boolean = false) => {
    cy.get(`[data-ouia-component-id="${ouiaId}-cancel-button"]`).click({ force });
  },
  confirm: (ouiaId: string, force: boolean = false) => {
    cy.get(`[data-ouia-component-id="${ouiaId}-confirm-button"]`).click({ force });
  },
  confirmShouldBeDisabled: (ouiaId: string) => {
    cy.get(`[data-ouia-component-id="${ouiaId}-confirm-button"]`).should('be.disabled');
  },
  confirmShouldBeEnabled: (ouiaId: string) => {
    cy.get(`[data-ouia-component-id="${ouiaId}-confirm-button"]`).should('not.be.disabled');
  },
  modalTitleShouldContain: (ouiaId: string, title: string) => {
    cy.get(`[data-ouia-component-id="${ouiaId}"]`)
      .find('h1, [data-ouia-component-type="PF6/Title"]')
      .should('contain.text', title);
  },
};
