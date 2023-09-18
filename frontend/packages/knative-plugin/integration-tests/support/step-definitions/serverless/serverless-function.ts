import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { addOptions } from '@console/dev-console/integration-tests/support/constants';
import { gitPO } from '@console/dev-console/integration-tests/support/pageObjects';
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
  cy.get('[data-test="serverless-function-type"]', { timeout: 30000 }).should('be.visible');
  cy.byTestID('serverless-function-type').find('dt').should('have.text', 'Type');
  cy.byTestID('serverless-function-type').find('dd').should('have.text', 'Function');
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

When('user selects Add Pipeline checkbox in Pipelines section', () => {
  gitPage.selectAddPipeline();
});

Then('user is able to see PipelineRuns in the {string} tab', (tab: string) => {
  topologySidePane.selectTab(tab);
  cy.byTestID('pipeline-overview').should('be.visible');
});

Then('user is not able to see Add Pipeline checkbox', () => {
  cy.get(gitPO.pipeline.addPipeline).should('not.exist');
});

Given('user created Serverless Function node Pipeline', () => {
  const yamlFileName = `support/testData/serverless-function-node-pipeline.yaml`;
  cy.exec(`oc apply -f ${yamlFileName}`, {
    failOnNonZeroExit: false,
  }).then(function (result) {
    cy.log(result.stdout);
  });
});

Then('user will be able to see VSCode extension card', () => {
  cy.byTestID('odc-serverless-vscode-extension-card').should('be.visible');
});

Then('user will be able to see IntelliJ extension card', () => {
  cy.byTestID('odc-serverless-intellij-extension-card').should('be.visible');
});
