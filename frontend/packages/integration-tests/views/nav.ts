import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
// eslint-disable-next-line import/no-cycle
import { app } from '@console/dev-console/integration-tests/support/pages/app';

export const nav = {
  sidenav: {
    switcher: {
      shouldHaveText: (text: string) => {
        // Wait for toggle to be visible and have the expected text
        cy.byLegacyTestID('perspective-switcher-toggle')
          .should('be.visible')
          .then(($toggle) => {
            if (text === switchPerspective.Administrator) {
              // if the switcher is hidden it means we are in the admin perspective
              if ($toggle.attr('id') === 'core-platform-perspective') {
                cy.log('Admin is the only perspective available');
                return;
              }
            }
            // Re-query to get fresh element and check text with retry
            cy.byLegacyTestID('perspective-switcher-toggle', { timeout: 30000 }).should(
              'contain.text',
              text,
            );
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

                  // Wait for menu to open with timeout for React 18 event handling
                  cy.byLegacyTestID('perspective-switcher-toggle').should(
                    'have.attr',
                    'aria-expanded',
                    'true',
                    { timeout: 5000 },
                  );

                  // eslint-disable-next-line cypress/no-unnecessary-waiting
                  cy.wait(1000); // wait for the menu options to render

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
            // Check if we're already on Developer, if not, switch
            cy.byLegacyTestID('perspective-switcher-toggle')
              .should('be.visible')
              .invoke('text')
              .then((currentText) => {
                const trimmedText = currentText.trim();
                cy.log(`Current perspective: "${trimmedText}"`);

                if (trimmedText.includes('Developer')) {
                  cy.log('Already on Developer perspective');
                } else {
                  // Not on Developer - switch to it
                  cy.log(`Switching from "${trimmedText}" to Developer`);

                  // Click to open menu
                  cy.byLegacyTestID('perspective-switcher-toggle').click();

                  // Wait for menu to open
                  cy.byLegacyTestID('perspective-switcher-toggle').should(
                    'have.attr',
                    'aria-expanded',
                    'true',
                    { timeout: 10000 },
                  );

                  // Wait a bit for portal to render
                  // eslint-disable-next-line cypress/no-unnecessary-waiting
                  cy.wait(1500);

                  // Click Developer option
                  cy.contains('[data-test-id="perspective-switcher-menu-option"]', 'Developer', {
                    timeout: 10000,
                  }).click();
                }
              });

            // Wait for the switch to complete (whether we just switched or were already there)
            cy.byLegacyTestID('perspective-switcher-toggle', { timeout: 15000 }).should(
              'contain.text',
              'Developer',
            );
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
