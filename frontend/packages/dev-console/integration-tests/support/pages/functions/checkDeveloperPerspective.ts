export const checkDeveloperPerspective = () => {
  cy.get('body').then(($body) => {
    cy.byLegacyTestID('perspective-switcher-toggle').then(($switcher) => {
      // switcher is present
      if ($switcher.attr('aria-hidden') !== 'true') {
        cy.byLegacyTestID('perspective-switcher-toggle').click();

        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000); // wait for the menu to open and render options

        if ($body.find('[data-test-id="perspective-switcher-menu-option"]').length !== 0) {
          cy.log('perspective switcher menu enabled');
          cy.byLegacyTestID('perspective-switcher-menu-option').contains('Developer');
          cy.byLegacyTestID('perspective-switcher-toggle').click();
          return;
        }
      }

      cy.exec(
        `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
        { failOnNonZeroExit: true },
      ).then((result) => {
        cy.log(result.stdout);
        cy.log(result.stderr);
      });
      cy.exec(`  oc rollout status -w deploy/console -n openshift-console`, {
        failOnNonZeroExit: true,
      }).then((result) => {
        cy.log(result.stderr);
      });
      cy.reload(true);
      cy.document().its('readyState').should('eq', 'complete');
      cy.log('perspective switcher menu refreshed');

      // Verify the Developer perspective is now available after reload.
      // The config pipeline (oc patch → operator reconcile → console rollout →
      // SERVER_FLAGS.perspectives update) can have delays, so we use an explicit
      // timeout to wait for the perspective option to appear in the switcher menu.
      cy.byLegacyTestID('perspective-switcher-toggle').click();

      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000); // wait for the menu to open and render options

      cy.byLegacyTestID('perspective-switcher-menu-option', { timeout: 30000 })
        .contains('Developer')
        .should('exist');
      cy.log('Developer perspective verified after reload');
      cy.byLegacyTestID('perspective-switcher-toggle').click();
    });
  });
};
