export const nav = {
  sidenav: {
    switcher: {
      shouldHaveText: (text: string) =>
        cy.byLegacyTestID('perspective-switcher-toggle').scrollIntoView().contains(text),
      changePerspectiveTo: (newPerspective: string) => {
        cy.byLegacyTestID('perspective-switcher-toggle').click();
        cy.byLegacyTestID('perspective-switcher-menu-option', { timeout: 10000 })
          .should('be.visible')
          .contains(newPerspective)
          .click();
      },
    },
    clusters: {
      shouldHaveText: (text: string) => cy.byLegacyTestID('cluster-dropdown-toggle').contains(text),
      changeClusterTo: (newCluster: string) =>
        cy
          .byLegacyTestID('cluster-dropdown-toggle')
          .click()
          .byLegacyTestID('cluster-dropdown-item')
          .contains(newCluster)
          .click(),
    },
    shouldHaveNavSection: (path: string[]) => {
      cy.get('#page-sidebar').contains(path[0]);
      if (path.length === 2) {
        cy.get('#page-sidebar').contains(path[1]);
      }
    },
    shouldNotHaveNavSection: (path: string[]) => {
      cy.get('#page-sidebar').should('not.have.text', path[0]);
      if (path.length === 2) {
        cy.get('#page-sidebar').should('not.have.text', path[1]);
      }
    },
    clickNavLink: (path: string[]) => cy.clickNavLink(path),
  },
};
