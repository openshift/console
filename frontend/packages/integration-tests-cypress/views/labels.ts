export const labels = {
  inputLabel: (label: string) => cy.byTestID('tags-input').type(label),
  confirmDetailsPageLabelExists: (label: string) => cy.byTestID('label-key').contains(label),
  clickDetailsPageLabel: () => cy.byTestID('label-key').click(),
  chipExists: (label: string) => cy.get('#search-toolbar').contains(label).should('exist'),
};
