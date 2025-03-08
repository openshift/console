import { app } from '@console/dev-console/integration-tests/support/pages';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';

export const nav = {
  sidenav: {
    switcher: {
      shouldHaveText: (text: string) => {
        app.waitForLoad();
        cy.get('body').then(($body) => {
          if ($body.find("[data-test-id='perspective-switcher-toggle']").length !== 0) {
            cy.byLegacyTestID('perspective-switcher-toggle').scrollIntoView().contains(text);
          }

          if (text.toLowerCase().startsWith('admin')) {
            cy.log('Already on admin perspective as there is no perspective switcher');
          } else {
            /* no perspective switcher and the switcher text is not admin,
             * so we must not be in the right perspective */
            throw new Error(
              `Expected perspective switcher to have text: ${text}, but the switcher is not present`,
            );
          }
        });
      },
      changePerspectiveTo: (newPerspective: string) => {
        app.waitForLoad();
        switch (newPerspective) {
          case 'Administrator':
          case 'administrator':
          case 'Admin':
          case 'admin':
            // if there is no perspective switcher, then we are already on admin perspective
            cy.get('body').then(($body) => {
              // check if developer perspective is already enabled
              if ($body.find("[data-test-id='perspective-switcher-toggle']").length !== 0) {
                cy.byLegacyTestID('perspective-switcher-toggle').then(($toggle) => {
                  if ($toggle.text().includes('Administrator')) {
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
              } else {
                cy.log('There is no perspective switcher, already on admin perspective');
              }
            });
            break;
          case 'Developer':
          case 'developer':
          case 'Dev':
          case 'dev':
            checkDeveloperPerspective();
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
