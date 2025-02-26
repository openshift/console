import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';

export const checkDeveloperPerspective = () => {
  cy.get('body').then(($body) => {
    // If the perspective switcher doesn't exist then skip this function
    if ($body.find("[data-test-id='perspective-switcher-toggle']").length === 0) {
      cy.log('perspective switcher not found, skipping checkDeveloperPerspective');
      return;
    }
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    if ($body.find('[data-test-id="perspective-switcher-menu-option"]').length !== 0) {
      cy.log('perspective switcher menu enabled');
      cy.byLegacyTestID('perspective-switcher-menu-option').contains('Developer');
      cy.byLegacyTestID('perspective-switcher-toggle').click();
    } else {
      cy.exec(
        `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
        { failOnNonZeroExit: true },
      ).then((result) => {
        cy.log(result.stderr);
      });
      cy.reload(true);
      cy.document().its('readyState').should('eq', 'complete');
      cy.exec(`  oc rollout status -w deploy/console -n openshift-console`, {
        failOnNonZeroExit: true,
      }).then((result) => {
        cy.log(result.stderr);
      });
      cy.log('perspective switcher menu refreshed');
    }
    guidedTour.close();
  });
};
