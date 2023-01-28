import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '@console/dev-console/integration-tests/support/constants';
import {
  addPage,
  gitPage,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';

When('user clicks on Create Serverless function card', () => {
  addPage.selectCardFromOptions(addOptions.CreateServerlessFunction);
});

When('git url {string} gets validated', (gitUrl: string) => {
  gitPage.verifyValidatedMessage(gitUrl);
});

When('user is able to see builder image version dropdown', () => {
  gitPage.verifyBuilderImageVersion();
});

When('user is able to see the runtime details', () => {
  cy.byTestID('imageStream-details').should('be.visible');
});

Then('user is able to see Type as Function', () => {
  cy.byTestID('serverless-function-type').should('be.visible');
  cy.byTestID('serverless-function-type')
    .find('dt')
    .should('have.text', 'Type');
  cy.byTestID('serverless-function-type')
    .find('dd')
    .should('have.text', 'Function');
});

Then('user clicks on the Knative Service workload {string}', (nodeName: string) => {
  topologyPage.knativeNode(nodeName).click({ force: true });
});

Then('user switches to the {string} tab', (tab: string) => {
  topologySidePane.selectTab(tab);
});

When('user clicks on Create button on Create Serverless function', () => {
  cy.byLegacyTestID('submit-button').click();
});
