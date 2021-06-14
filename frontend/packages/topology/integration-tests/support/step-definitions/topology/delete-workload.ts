import { When } from 'cypress-cucumber-preprocessor/steps';
import { app } from '@console/dev-console/integration-tests/support/pages';
import { topologyActions } from '@console/topology/integration-tests/support/pages/topology/topology-actions-page';
import { topologySidePane } from '@console/topology/integration-tests/support/pages/topology/topology-side-pane-page';
import { topologyPO } from '../../page-objects/topology-po';

When('user clicks on Action menu', () => {
  topologySidePane.clickActionsDropDown();
});

When('user clicks {string} from action menu', (actionItem: string) => {
  app.waitForLoad();
  topologyActions.selectAction(actionItem);
});

When('user clicks on Delete button from modal', () => {
  cy.get(topologyPO.graph.deleteWorkload).click();
});
