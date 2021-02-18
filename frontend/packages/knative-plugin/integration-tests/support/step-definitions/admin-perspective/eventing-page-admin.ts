import { createForm } from '@console/dev-console/integration-tests/support/pages/app';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';
import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';

Given('user is at eventing page', () => {
  operatorsPage.navigateToEventingPage();
});

Given('user has created Broker {string}', (brokerName: string) => {
  // TODO: implement step
  cy.log(brokerName);
});

Given(
  'user has created trigger subscribing to knative service newly created {string}',
  (knativeService: string) => {
    cy.log(knativeService);
  },
);

Given('user has created channel {string}', (channelName: string) => {
  // TODO: implement step
  cy.log(channelName);
});

Given('user click on broker {string} in broker tab', (brokerName: string) => {
  // TODO: implement step
  cy.log(brokerName);
});

Given('user is at Trigger Details page', () => {
  // TODO: implement step
});

Given('user is at Channel Details page', () => {
  // TODO: implement step
});

Given('user is at Subscription Details page', () => {
  // TODO: implement step
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});

When('user selects Event Source', () => {
  // TODO: implement step
});

When('user clicks on Ping Source', () => {
  // TODO: implement step
});

When('user enters {string} in Data field', (data: string) => {
  // TODO: implement step
  cy.log(data);
});

When('user enters {string} in Schedule field', (schedule: string) => {
  // TODO: implement step
  cy.log(schedule);
});

When('user selects resource {string}', (resourceName: string) => {
  // TODO: implement step
  cy.log(resourceName);
});

When('user selects Channel', () => {
  // TODO: implement step
});

When('user selects Default channels', () => {
  // TODO: implement step
});

Then('user will be redirected to Project Details page', () => {
  // TODO: implement step
});

Then('user will see ping-source created', () => {
  // TODO: implement step
});

Then('user will see channel created', () => {
  // TODO: implement step
});

Then('user will see broker at Brokers tab', () => {
  // TODO: implement step
});

Then(
  'user will see Broker Details page after clicking on broker {string}',
  (brokerName: string) => {
    // TODO: implement step
    cy.log(brokerName);
  },
);

Then('user will see trigger at Triggers tab', () => {
  // TODO: implement step
});

Then('user will see channel at Channels tab', () => {
  // TODO: implement step
});

Then('user will see subscription at Triggers tab', () => {
  // TODO: implement step
});

Then(
  'user will see Subscription Details page after clicking on subscription {string}',
  (subscriptionName: string) => {
    // TODO: implement step
    cy.log(subscriptionName);
  },
);

Then('user will shown with Broker Details page', () => {
  // TODO: implement step
});

Then('user will see Details tab with Broker Details', () => {
  // TODO: implement step
});

Then('user will see YAML generated for Broker under YAML tab', () => {
  // TODO: implement step
});

Then('user will see Broker name and Subscriber name under Triggers tab', () => {
  // TODO: implement step
});

Then('user will see Details tab with Trigger Details', () => {
  // TODO: implement step
});

Then('user will see YAML generated for Trigger under YAML tab', () => {
  // TODO: implement step
});

Then('user will see Details tab with Channel Details', () => {
  // TODO: implement step
});

Then('user will see YAML generated for Channel under YAML tab', () => {
  // TODO: implement step
});

Then('user will see Channel name and Subscriber name under Subscriptions tab', () => {
  // TODO: implement step
});

Then('user will see Details tab with Subscription Details', () => {
  // TODO: implement step
});

Then('user will see YAML generated for Subscription under YAML tab', () => {
  // TODO: implement step
});
