import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { topologyPO } from '../../page-objects/topology-po';

When('user clicks on the Display dropdown', () => {
  topologyPage.clickDisplayOptionDropdown();
});

Then('user will see the Expand is checked', () => {
  topologyPage.verifyExpandChecked();
});

Then('user will see the Pod count is unchecked', () => {
  topologyPage.verifyPodCountUnchecked();
});

Then('user will see the Labels is checked', () => {
  cy.get(topologyPO.graph.displayOptions.showLabels).should('be.checked');
});

Then('app icon is not displayed', () => {
  topologyPage.clickDisplayOptionDropdown();
  cy.byTestID('icon application').should('not.exist');
});

Then('user will see the Application groupings option is disabled', () => {
  cy.get(topologyPO.graph.displayOptions.applicationGroupings).should('be.disabled');
});

Then('user will see that the Expand options are disabled', () => {
  topologyPage.verifyExpandOptionsDisabled();
});

When('user unchecks the Expand', () => {
  topologyPage.uncheckExpandToggle();
});

Then('user will see the Knative Services checkbox is disabled', () => {
  topologyPage.verifyExpandDisabled();
});
