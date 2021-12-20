import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import {
  devNavigationMenu,
  nodeActions,
  resourceTypes,
} from '@console/dev-console/integration-tests/support/constants';
import {
  topologyPage,
  topologySidePane,
  addSubscription,
  createChannel,
  createGitWorkloadIfNotExistsOnTopologyPage,
} from '@console/dev-console/integration-tests/support/pages';
import { navigateTo, sidePane } from '@console/dev-console/integration-tests/support/pages/app';

Given('user has created channel {string}', (channelName: string) => {
  createChannel(channelName);
});

When(
  'user right clicks on the Channel {string} to open the context menu',
  (channelName: string) => {
    topologyPage.rightClickOnNode(channelName);
  },
);

When('user selects {string} from Context Menu', (menuOption: string) => {
  topologyPage.selectContextMenuAction(menuOption);
});

When('user enters Name as {string} on Add Subscription modal', (subscriberName: string) => {
  modal.modalTitleShouldContain('Add Subscription');
  addSubscription.enterSubscriberName(subscriberName);
});

When('user selects Subscriber {string} on Add Subscription modal', (subscriber: string) => {
  addSubscription.selectKnativeService(subscriber);
});

When('user clicks on Add button', () => {
  modal.submit();
});

Then(
  'user will see connection between Channel {string} and Subscriber {string}',
  (channelName: string, subscriber: string) => {
    topologyPage.clickOnNode(channelName);
    topologySidePane.verify();
    cy.byLegacyTestID(subscriber).should('be.visible');
    sidePane.close();
  },
);

Given('user has created knative service {string}', (knativeServiceName: string) => {
  createGitWorkloadIfNotExistsOnTopologyPage(
    'https://github.com/sclorg/nodejs-ex.git',
    knativeServiceName,
    resourceTypes.knativeService,
  );
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on the Add Subscription', () => {
  topologyPage.selectContextMenuAction(nodeActions.AddSubscription);
});

When('user will click on the Subscriber dropdown on the modal', () => {
  cy.get('[id=form-ns-dropdown-spec-subscriber-ref-name-field"]').click();
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
