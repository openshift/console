export const PROVIDER = 'foo';

export const customizeSource = {
  fillForm: ({ vmtName }: { vmtName: string }) => {
    cy.get('#vmt-name').type(vmtName);
    cy.get('#vmt-provider').type(PROVIDER);
    cy.byTestID('start-customize').click();
    cy.byTestID('status-text').should('exist');
  },
  finishCustomization: () => {
    cy.byTestID('finish-customization').click();
    cy.get('#confirm-seal').click();
    cy.get('#confirm-action').click();
    cy.byTestID('navigate-list').should('be.enabled', { timeout: 15000 });
    cy.byTestID('navigate-list').click();
  },
};
