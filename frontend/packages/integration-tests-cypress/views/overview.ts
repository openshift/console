export const overviewPage = {
  projectOverviewShouldBeVisible: () => {
    cy.get(`.odc-topology-list-view`).should('be.visible');
  },
  itemsShouldBeVisible: () => {
    cy.get(`.odc-topology-list-view__item-row`).should('be.visible');
  },
  groupLabelItemContains: (kind) => {
    cy.get('.odc-topology-list-view__kind-label').contains(kind.label);
  },
  projectOverviewListItemContains: (name) => {
    cy.get('.odc-topology-list-view__label-cell').contains(name);
  },
  clickProjectOverviewListItem: (name) => {
    cy.get('.odc-topology-list-view__label-cell')
      .contains(name)
      .click();
  },
  detailsSidebarShouldExist: (exist = true) => {
    cy.get('.resource-overview').should(exist ? 'exist' : 'not.exist');
  },
  detailsSidebarHeadingContains: (name) => {
    cy.get('.resource-overview__heading .co-m-pane__name').contains(name);
  },
};
