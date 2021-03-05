import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { topologyPage } from '../../../../../dev-console/integration-tests/support/pages/topology/topology-page';
import { topologySidePane } from '../../../../../dev-console/integration-tests/support/pages/topology/topology-side-pane-page';

When('user clicks on event source {string} to open side bar', (eventSourceName: string) => {
  topologyPage.search(eventSourceName);
  cy.get('[data-type="event-source"]')
    .eq(0)
    .click();
  topologySidePane.verify();
});

When('user selects {string} from side bar Action menu', (action: string) => {
  topologySidePane.selectNodeAction(action);
});

Then('user can see side bar with header name {string}', (headerName: string) => {
  topologySidePane.verifyTitle(headerName);
});
