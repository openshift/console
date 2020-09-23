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

export namespace DetailsPageSelector {
  export const name = 'dd[data-test-selector="details-item-value__Name"]';
  export const namespace = 'dd[data-test-selector="details-item-value__Namespace"] a';
}
