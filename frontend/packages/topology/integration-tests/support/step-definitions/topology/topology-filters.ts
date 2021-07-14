import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';

When('user clicks on the Display dropdown', () => {
  topologyPage.clickDisplayOptionDropdown();
});

Then('user will see the Connectivity Mode is checked', () => {
  topologyPage.verifyConnectivityModeChecked();
});

Then('user will see the Expand is checked', () => {
  topologyPage.verifyExpandChecked();
});

Then('user will see the Pod count is unchecked', () => {
  topologyPage.verifyPodCountUnchecked();
});

When('user checks the Consumption Mode', () => {
  topologyPage.checkConsumptionMode();
});

When('user will see that the Expand options are disabled', () => {
  topologyPage.verifyExpandOptionsDisabled();
});

When(
  'user will see that the application groupings {string} no longer visible in the view',
  (applicationGroupings: string) => {
    topologyPage.verifyWorkloadNotInTopologyPage(applicationGroupings);
  },
);

When('user unchecks the Expand', () => {
  topologyPage.checkConnectivityMode();
  topologyPage.uncheckExpandToggle();
});

Then('user will see the Knative Services checkbox is disabled', () => {
  topologyPage.verifyExpandDisabled();
});
