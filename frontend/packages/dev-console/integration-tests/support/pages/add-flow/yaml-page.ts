export const yamlPage = {
  clickOnCreateButton: () => cy.byTestID('save-changes').click(),
  clickOnCancelButton: () => cy.byTestID('cancel').click(),
};
