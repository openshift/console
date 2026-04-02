import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
// eslint-disable-next-line import/no-cycle
import { app } from '@console/dev-console/integration-tests/support/pages/app';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';

export const nav = {
  sidenav: {
    switcher: {
      shouldHaveText: (text: string) => {
        cy.byLegacyTestID('perspective-switcher-toggle')
          .should('be.visible')
          .then(($body) => {
            if (text === switchPerspective.Administrator) {
              // if the switcher is hidden it means we are in the admin perspective
              if ($body.attr('id') === 'core-platform-perspective') {
                cy.log('Admin is the only perspective available');
                return;
              }
            }
            cy.byLegacyTestID('perspective-switcher-toggle').contains(text, { timeout: 30000 });
          });
      },
      changePerspectiveTo: (newPerspective: string) => {
        app.waitForDocumentLoad();
        switch (newPerspective) {
          case 'Core platform':
          case 'core platform':
          case 'Admin':
          case 'admin':
            cy.byLegacyTestID('perspective-switcher-toggle')
              .should('be.visible')
              .then(($body) => {
                if ($body.attr('id') === 'core-platform-perspective') {
                  cy.log('Admin is the only perspective available');
                  cy.byLegacyTestID('perspective-switcher-toggle').should('be.visible');
                  return;
                }

                if ($body.text().includes('Core platform')) {
                  cy.log('Already on admin perspective');
                } else {
                  cy.byLegacyTestID('perspective-switcher-toggle').click();

                  // eslint-disable-next-line cypress/no-unnecessary-waiting
                  cy.wait(1000); // wait for the menu to open and render options

                  cy.byLegacyTestID('perspective-switcher-menu-option')
                    .contains(newPerspective)
                    .click({ force: true });
                }
              });
            break;
          case 'Developer':
          case 'developer':
          case 'Dev':
          case 'dev':
            // Wait for the toggle to contain any non-empty text before deciding
            // whether we need to switch perspectives.
            cy.byLegacyTestID('perspective-switcher-toggle')
              .should('be.visible')
              .then(($body) => {
                if ($body.text().includes('Developer')) {
                  cy.log('Already on dev perspective');
                } else {
                  checkDeveloperPerspective();
                }
              });

            cy.byLegacyTestID('perspective-switcher-toggle')
              .should('be.visible')
              .then(($body) => {
                if ($body.text().includes('Developer')) {
                  cy.log('Already on dev perspective');
                  return;
                }

                cy.byLegacyTestID('perspective-switcher-toggle').click();

                // eslint-disable-next-line cypress/no-unnecessary-waiting
                cy.wait(1000); // wait for the menu to open and render options

                cy.byLegacyTestID('perspective-switcher-menu-option')
                  .contains(newPerspective)
                  .click();
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
