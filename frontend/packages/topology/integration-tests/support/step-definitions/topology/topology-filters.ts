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
  topologyPage.defaultState();
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
When('user clicks display options', () => {
  cy.get(topologyPO.displayFilter.display).click();
});

When('user disbales expand option', () => {
  // eslint-disable-next-line promise/catch-or-return
  cy.get('body').then((el) => {
    if (el.find(topologyPO.displayFilter.disabledClass).length === 0) {
      cy.get(topologyPO.displayFilter.expandOption).click({ force: true });
    }
  });
});

When('user enables expand option', () => {
  // eslint-disable-next-line promise/catch-or-return
  cy.get('body').then((el) => {
    if (el.find(topologyPO.displayFilter.disabledClass).length !== 0) {
      cy.get(topologyPO.displayFilter.expandOption).click({ force: true });
    }
  });
});

When('user unchecks the application grouping option', () => {
  cy.get(topologyPO.displayFilter.applicationGroupingOption).uncheck({ force: true });
});

When('user checks the application grouping option', () => {
  cy.get(topologyPO.displayFilter.applicationGroupingOption).check({ force: true });
});

Then('user will see the application_groupings checkbox will disable', () => {
  cy.get(topologyPO.displayFilter.applicationGroupingOption).should('be.disabled');
});

Then('user will see workload in text view', () => {
  cy.get(topologyPO.displayFilter.unexpandedNode).should('not.exist');
});

When('user checks the pod count option', () => {
  cy.get(topologyPO.displayFilter.podLabelOptions)
    .eq(2)
    .check();
});

Then('user will able to see the pod count inside workload', () => {
  cy.get(topologyPO.displayFilter.podRingText).should('be.visible');
});

When('user unchecks the labels option', () => {
  cy.get(topologyPO.displayFilter.podLabelOptions)
    .eq(3)
    .uncheck();
});

Then('user will not able to see the labels on workload', () => {
  cy.get(topologyPO.graph.nodeLabel).should('not.exist');
  cy.get(topologyPO.graph.groupLabel).should('not.exist');
});

Then('user will see deployment section is not visible', () => {
  cy.get(topologyPO.displayFilter.deploymentLabel).should('not.exist');
});

Then('user will see deployments in count view', () => {
  cy.get(topologyPO.displayFilter.deployemntCount).should('be.visible');
  topologyPage.defaultState();
});
