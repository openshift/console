import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { app } from '../app';

export const checkDeveloperPerspective = () => {
  cy.get('[data-test="console-nav"]').then(($body) => {
    // check if developer perspective is already enabled
    if ($body.find("[data-test-id='perspective-switcher-toggle']").length !== 0) {
      cy.byLegacyTestID('perspective-switcher-toggle').click();
      if ($body.find('[data-test-id="perspective-switcher-menu-option"]').length !== 0) {
        cy.log('perspective switcher menu enabled');
        cy.byLegacyTestID('perspective-switcher-menu-option').contains('Developer');
        cy.byLegacyTestID('perspective-switcher-toggle').click();
        guidedTour.close();
        return;
      }
    }

    cy.exec(
      `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
      { failOnNonZeroExit: true },
    ).then((result) => {
      cy.log(result.stderr);
    });
    cy.reload(true);
    app.waitForDocumentLoad();
    cy.exec(`oc rollout status -w deploy/console -n openshift-console`, {
      failOnNonZeroExit: true,
    }).then((result) => {
      cy.log(result.stderr);
    });
    cy.log('perspective switcher menu refreshed');
    cy.reload(true);
    app.waitForLoad();
  });
};
