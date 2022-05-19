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

Then('user will see Deployment and DeploymentConfig options with 1 associated with it', () => {
  cy.get(topologyPO.toolbarFilterPO.deployment).should('be.visible');
  cy.get(topologyPO.toolbarFilterPO.deploymentConfig).should('be.visible');
  cy.get(topologyPO.toolbarFilterPO.deploymentSpan).contains('Deployment (1)');
  cy.get(topologyPO.toolbarFilterPO.deploymentConfigSpan).contains('DeploymentConfig (1)');
});

Then('user clicks on Deployment checkbox to see only the deployment type workload', () => {
  cy.get(topologyPO.toolbarFilterPO.deploymentCheckbox).check();
  cy.get(topologyPO.toolbarFilterPO.deploymentApp).should('be.visible');
  cy.get(topologyPO.toolbarFilterPO.deploymentConfigApp).should('not.exist');
});

Then(
  'user clicks on DeploymentConfig checkbox to see only the deploymentconfig type workload',
  () => {
    cy.get(topologyPO.toolbarFilterPO.deploymentCheckbox).uncheck();
    cy.get(topologyPO.toolbarFilterPO.deploymentConfigCheckbox).check();
    cy.get(topologyPO.toolbarFilterPO.deploymentConfigApp).should('be.visible');
    cy.get(topologyPO.toolbarFilterPO.deploymentApp).should('not.exist');
  },
);
