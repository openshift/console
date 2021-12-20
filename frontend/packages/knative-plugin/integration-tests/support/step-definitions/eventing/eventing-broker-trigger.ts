import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import {
  resourceTypes,
  devNavigationMenu,
  nodeActions,
} from '@console/dev-console/integration-tests/support/constants';
import {
  createGitWorkloadIfNotExistsOnTopologyPage,
  navigateTo,
} from '@console/dev-console/integration-tests/support/pages';
import { createBroker } from '@console/dev-console/integration-tests/support/pages/functions/createBroker';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';

Given('user has created knative service {string}', (knativeServiceName: string) => {
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    knativeServiceName,
    resourceTypes.knativeService,
  );
});

Given('user created Broker {string}', (brokerName: string) => {
  createBroker(brokerName);
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user right clicks on the Broker {string} to open the context menu', (brokerName: string) => {
  topologyPage.rightClickOnNode(brokerName);
});

When('user clicks on the Add Trigger', () => {
  topologyPage.selectContextMenuAction(nodeActions.AddTrigger);
});

When('user will click on the Subscriber dropdown on the modal', () => {
  cy.get('[id="form-ns-dropdown-spec-subscriber-ref-name-field"]').click();
});

Then(
  'Subscriber has knative service dropdown with {string} and {string} options',
  (option1: string, option2: string) => {
    cy.get("[role='listbox']")
      .should('be.visible')
      .and('contain', option1)
      .and('contain', option2);
  },
);
