export const detailsPage = {
  titleShouldContain: (title: string) => {
    cy.get('[data-test="page-heading"]', { timeout: 30000 }).should('be.visible');
    return cy.get('[data-test="page-heading"]').contains(title, { timeout: 30000 });
  },
  sectionHeaderShouldExist: (sectionHeading: string) =>
    cy.get(`[data-test-section-heading="${sectionHeading}"]`).should('exist'),
  labelShouldExist: (labelName: string) => cy.byTestID('label-list').contains(labelName),
  clickPageActionFromDropdown: (actionID: string) => {
    cy.byLegacyTestID('actions-menu-button').click();
    cy.byTestActionID(actionID).click();
  },
  clickPageActionButton: (action: string) => {
    cy.byLegacyTestID('details-actions').contains(action).click();
  },
  isLoaded: () => cy.byTestID('skeleton-detail-view').should('not.exist'),
  breadcrumb: (breadcrumbIndex: number) => cy.byLegacyTestID(`breadcrumb-link-${breadcrumbIndex}`),
  selectTab: (name: string) => {
    cy.get(`a[data-test-id="horizontal-link-${name}"]`).should('exist').click();
  },
};

export namespace DetailsPageSelector {
  export const name = 'dd[data-test-selector="details-item-value__Name"]';
  export const namespace = 'dd[data-test-selector="details-item-value__Namespace"] a';
  export const sectionHeadings = '[data-test-section-heading]';
  export const itemLabels = 'dt';
  export const horizontalNavTabs = '.pf-v6-c-tabs__item';
}
