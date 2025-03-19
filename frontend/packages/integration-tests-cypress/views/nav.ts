import { app } from '@console/dev-console/integration-tests/support/pages';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';

export const nav = {
  sidenav: {
    switcher: {
      shouldHaveText: (text: string) =>
        cy.byLegacyTestID('perspective-switcher-toggle').scrollIntoView().contains(text),
      changePerspectiveTo: (newPerspective: string) => {
        app.waitForDocumentLoad();
        switch (newPerspective) {
          case 'Administrator':
          case 'administrator':
          case 'Admin':
          case 'admin':
            cy.byLegacyTestID('perspective-switcher-toggle').then(($body) => {
              if ($body.text().includes('Administrator')) {
                cy.log('Already on admin perspective');
                cy.byLegacyTestID('perspective-switcher-toggle')
                  .scrollIntoView()
                  .contains(newPerspective);
              } else {
                cy.byLegacyTestID('perspective-switcher-toggle')
                  .click()
                  .byLegacyTestID('perspective-switcher-menu-option')
                  .contains(newPerspective)
                  .click({ force: true });
              }
            });
            break;
          case 'Developer':
          case 'developer':
          case 'Dev':
          case 'dev':
            cy.byLegacyTestID('perspective-switcher-toggle')
              .should('be.visible')
              .then(($body) => {
                if ($body.text().includes('Developer')) {
                  cy.log('Already on dev perspective');
                  cy.byLegacyTestID('perspective-switcher-toggle')
                    .scrollIntoView()
                    .contains(newPerspective);
                } else {
                  checkDeveloperPerspective();
                  cy.byLegacyTestID('perspective-switcher-toggle')
                    .click()
                    .byLegacyTestID('perspective-switcher-menu-option')
                    .contains(newPerspective)
                    .click({ force: true });
                }
              });
            break;
          default:
            cy.byLegacyTestID('perspective-switcher-toggle')
              .click()
              .byLegacyTestID('perspective-switcher-menu-option')
              .contains(newPerspective)
              .click({ force: true });
        }
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
