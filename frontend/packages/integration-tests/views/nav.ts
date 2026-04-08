import { switchPerspective } from '@console/dev-console/integration-tests/support/constants';
// eslint-disable-next-line import/no-cycle
import { app } from '@console/dev-console/integration-tests/support/pages/app';

export const nav = {
  sidenav: {
    switcher: {
      shouldHaveText: (text: string) => {
        // Wait for toggle to be visible and have the expected text.
        // Check .pf-v6-c-menu-toggle__text specifically. PF appends the
        // dropdown menu inside the toggle element, so .text() on the toggle
        // itself would include menu item labels.
        cy.byLegacyTestID('perspective-switcher-toggle')
          .should('be.visible')
          .then(($toggle) => {
            if (text === switchPerspective.Administrator) {
              if ($toggle.attr('id') === 'core-platform-perspective') {
                cy.log('Admin is the only perspective available');
                return;
              }
            }
            cy.byLegacyTestID('perspective-switcher-toggle')
              .find('.pf-v6-c-menu-toggle__text', { timeout: 30000 })
              .should('contain.text', text);
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
              .then(($toggle) => {
                if ($toggle.attr('id') === 'core-platform-perspective') {
                  cy.log('Admin is the only perspective available');
                  cy.byLegacyTestID('perspective-switcher-toggle').should('be.visible');
                  return;
                }

                // Read text from .pf-v6-c-menu-toggle__text to avoid picking up
                // dropdown menu item text appended inside the toggle by PF popper.
                const $label = $toggle.find('.pf-v6-c-menu-toggle__text');
                const toggleText = ($label.length ? $label.text() : $toggle.text()).trim();

                if (toggleText.includes('Core platform')) {
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
            // Check if we're already on Developer, if not, switch.
            // Read text from .pf-v6-c-menu-toggle__text to avoid picking up
            // dropdown menu item text (PF appends the menu inside the toggle
            // element via popperProps.appendTo).
            cy.byLegacyTestID('perspective-switcher-toggle')
              .should('be.visible')
              .find('.pf-v6-c-menu-toggle__text')
              .invoke('text')
              .then((currentText) => {
                const trimmedText = currentText.trim();
                cy.log(`Current perspective: "${trimmedText}"`);

                if (trimmedText === 'Developer') {
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
            cy.byLegacyTestID('perspective-switcher-toggle', { timeout: 15000 })
              .find('.pf-v6-c-menu-toggle__text')
              .should('contain.text', 'Developer');
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
