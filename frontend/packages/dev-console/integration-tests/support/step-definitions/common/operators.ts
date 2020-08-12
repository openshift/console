import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { operatorsPage, operatorsObj } from '../../pages/operators_page';
import  { operators } from '../../constants/global'

Given('user is at Operator Hub page with the header name {string}', (headerName) => {
  operatorsPage.navigateToOperaotorHubPage();
  cy.titleShouldBe(headerName);
});

When('user searches for {string}', (operatorName: operators) => {
  operatorsPage.searchOperator(operatorName);
});

When('clicks OpenShift Pipelines Operator card on Operator Hub page', () => {
  operatorsPage.selectOperator(operators.pipelineOperator);
});

When('click install button present on the right side pane', () => {
  operatorsPage.verifySiedPane();
  operatorsPage.clickInstallOnSidePane();
});

Then('OpenShift Pipeline operator subscription page will be displayed', () => {
  operatorsPage.verifyPipelineOperatorSubscriptionPage();
});

Given('user is at OpenShift Pipeline Operator subscription page', () => {
  operatorsPage.navigateToOperaotorHubPage();
  cy.titleShouldBe('OperatorHub');
  operatorsPage.searchOperator('OpenShift Pipelines Operator');
  operatorsPage.selectOperator(operators.pipelineOperator);
  operatorsPage.verifySiedPane();
  operatorsPage.clickInstallOnSidePane();
  operatorsPage.verifyPipelineOperatorSubscriptionPage();
});

When('user installs the pipeline operator with default values', () => {
  operatorsPage.installOperator();
});

Then('user redirects to Installed operators page', () => {
  cy.titleShouldBe('Installed Operators');
});

Then('Installed operators page will contain {string}', (operatorName: string) => {
  operatorsPage.verifyInstalledOperator(operatorName);
});

Given('user is at OpenShift Serverless Operator subscription page', () => {
  operatorsPage.navigateToOperaotorHubPage();
  cy.titleShouldBe('OperatorHub');
  operatorsPage.searchOperator('OpenShift Serverless Operator');
  operatorsPage.selectOperator(operators.serverlessOperator);
  operatorsPage.verifySiedPane();
  operatorsPage.clickInstallOnSidePane();
  operatorsPage.verifyServerlessOperatorSubscriptionPage();
});

Given('cluster is installed with kantive serverless operator', () => {
  operatorsPage.verifyOperatorInNavigationMenu('Serverless');
});

Given('user is on the knative-eventing namespace', () => {
  // TODO: implement step
});

Given('cluster is installed with knative serverless and eventing operators', () => {
  // TODO: implement step
});

Given('cluster is installed with knative serverless operator', () => {
  // TODO: implement step
});

Given('user is at Eclipse che Operator subscription page', () => {
  // TODO: implement step
});

When('user uninstalls the pipeline operator from right side pane', () => {
  operatorsPage.verifySiedPane();
  operatorsPage.clickUninstallOnSidePane();
});

When('clicks on Unistall button present in popup with header message Uninstall Operator?', () => {
  cy.alertTitleShouldBe('Uninstall Operator?');
  cy.get(operatorsObj.uninstallPopup.uninstall).click();
});

When('user installs the Serverless operator with default values', () => {
  operatorsPage.installOperator();
});

When('user navigates to installed operators page in Admin perspecitve', () => {
  // TODO: implement step
});

When('clicks kantive eventing provided api pressent in kantive serverless operator', () => {
  // TODO: implement step
});

When('click Create Kantive Eventing button present in kantive Eventing tab', () => {
  // TODO: implement step
});

When('click on create button', () => {
  // TODO: implement step
});

When('user search and installs the kantive Camel operator with default values', () => {
  // TODO: implement step
});

When('user installs the Eclipse che operator with default values', () => {
  // TODO: implement step
});

Then('serverless tab displays in navigation menu of admin page', () => {
  // TODO: implement step
});

Then('Event sources card display in +Add page in dev perspecitve', () => {
  // TODO: implement step
});

Then('user redirects to Installed operators page', () => {
  cy.titleShouldBe('Installed Operators');
});

Then('page will contain knative apache camel operator', () => {
  // TODO: implement step
});

Then('Installed operators page will contain {string}', (operatorName: string) => {
  operatorsPage.verifyOperatoNotAvailable(operatorName);
})
