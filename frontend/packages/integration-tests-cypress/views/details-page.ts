export const detailsPage = {
  titleShouldContain: (title: string) => cy.byLegacyTestID('resource-title').contains(title),
  sectionHeaderShouldExist: (sectionHeading: string) =>
    cy.get(`[data-test-section-heading="${sectionHeading}"]`).should('exist'),
  labelShouldExist: (labelName: string) => cy.byTestID('label-list').contains(labelName),
  clickPageActionFromDropdown: (actionID: string) => {
    cy.byLegacyTestID('actions-menu-button').click();
    cy.byTestActionID(actionID).click();
  },
  clickPageActionButton: (action: string) => {
    cy.byLegacyTestID('details-actions')
      .contains(action)
      .click();
  },
};
