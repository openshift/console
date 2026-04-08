export const checkDeveloperPerspective = () => {
  // Wait for page to be ready
  cy.document().its('readyState').should('eq', 'complete');

  cy.byLegacyTestID('perspective-switcher-toggle')
    .should('be.visible')
    .then(($toggle) => {
      // Read text only from the toggle label, not from the dropdown menu items
      // that PF appends inside the toggle element via popperProps.appendTo.
      const $label = $toggle.find('.pf-v6-c-menu-toggle__text');
      const currentText = ($label.length ? $label.text() : $toggle.text()).trim();
      const isSinglePerspective = $toggle.attr('id') === 'core-platform-perspective';

      cy.log(`Current perspective: "${currentText}"`);

      // If already on Developer, we're done
      if (currentText === 'Developer') {
        cy.log('Already on Developer perspective');
        return;
      }

      // If single-perspective mode (only Admin), enable Developer
      if (isSinglePerspective) {
        cy.log('Single-perspective mode, enabling Developer');
        cy.exec(
          `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
          { failOnNonZeroExit: true },
        );
        cy.exec(`oc rollout status -w deploy/console -n openshift-console`, {
          failOnNonZeroExit: true,
        });
        cy.reload(true);
        cy.document().its('readyState').should('eq', 'complete');
      }

      // Switch to Developer
      cy.log('Switching to Developer perspective');
      cy.byLegacyTestID('perspective-switcher-toggle').click();

      // Wait for menu to open
      cy.byLegacyTestID('perspective-switcher-toggle', { timeout: 10000 }).should(
        'have.attr',
        'aria-expanded',
        'true',
      );

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1500);

      // Click Developer option
      cy.contains('[data-test-id="perspective-switcher-menu-option"]', 'Developer', {
        timeout: 10000,
      }).click();

      // Verify we're on Developer: check .pf-v6-c-menu-toggle__text specifically
      // because PF appends the dropdown menu inside the toggle element.
      cy.byLegacyTestID('perspective-switcher-toggle', { timeout: 15000 })
        .find('.pf-v6-c-menu-toggle__text')
        .should('contain.text', 'Developer');

      // Wait for perspective to fully load
      cy.document().its('readyState').should('eq', 'complete');
    });
};
