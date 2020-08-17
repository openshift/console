import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { operatorsPage, operatorsObj } from '../../pages/operators_page';
import  { operators, switchPerspective, devNavigationMenu } from '../../constants/global'
import { projectNameSpace, perspective, naviagteTo } from '../../pages/app';
import { addPage } from '../../pages/add_page';

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
  operatorsPage.verifySubscriptionPage('OpenShift Pipelines Operator');
});

Given('user is at OpenShift Pipeline Operator subscription page', () => {
  operatorsPage.navigateToOperaotorHubPage();
  operatorsPage.searchOperator('OpenShift Pipelines Operator');
  operatorsPage.selectOperator(operators.pipelineOperator);
  operatorsPage.verifySiedPane();
  operatorsPage.clickInstallOnSidePane();
  operatorsPage.verifySubscriptionPage('OpenShift Pipelines Operator');
});

When('user installs the pipeline operator with default values', () => {
  operatorsPage.installOperator();
});

Then('page redirects to Installed operators', () => {
  cy.titleShouldBe('Installed Operators');
});

Then('Installed operators page will contain {string}', (operatorName: string) => {
  operatorsPage.verifyInstalledOperator(operatorName);
});

Then('user will see a modal with title {string}', (operatorName: string) => {
  cy.get('article h1').should('contain.text', operatorName);
});

Then('user will see a View Operator button', () => {
  cy.get('[role="progressbar"]', {timeout: 15000}).should('not.be.visible');
  cy.get('button', {timeout: 15000}).contains('View Operator').should('be.visible');
});

Then('user will see serverless option on left side navigation menu', () => {
  operatorsPage.verifyOperatorInNavigationMenu('Serverless');
});

Given('user is at OpenShift Serverless Operator subscription page', () => {
  operatorsPage.navigateToOperaotorHubPage();
  operatorsPage.searchOperator('OpenShift Serverless Operator');
  operatorsPage.selectOperator(operators.serverlessOperator);
  operatorsPage.verifySiedPane();
  operatorsPage.clickInstallOnSidePane();
  operatorsPage.verifySubscriptionPage('OpenShift Serverless Operator');
});

When('user installs the Serverless operator with default values', () => {
  operatorsPage.installOperator();
});

Given('cluster is installed with kantive serverless operator', () => {
  operatorsPage.verifyOperatorInNavigationMenu('Serverless');
});

Given('user is on the knative-eventing namespace', () => {
  projectNameSpace.selectProject('knative-eventing');
});

Given('cluster is installed with knative serverless and eventing operators', () => {
  operatorsPage.verifyOperatorInNavigationMenu('Serverless');
  operatorsPage.navigateToInstalloperatorsPage();
  operatorsPage.verifyInstalledOperator('OpenShift Serverless Operator');
  cy.get('a[title="knativeeventings.operator.knative.dev"]').should('be.visible');
});

Given('user is at Eclipse che Operator subscription page', () => {
  operatorsPage.navigateToOperaotorHubPage();
  operatorsPage.searchOperator('Eclipse Che');
  operatorsPage.selectOperator(operators.eclipseCheOperator);
  operatorsPage.verifySiedPane();
  operatorsPage.clickInstallOnSidePane();
  operatorsPage.verifySubscriptionPage('Eclipse Che');
});

When('user uninstalls the pipeline operator from right side pane', () => {
  operatorsPage.verifySiedPane();
  operatorsPage.clickUninstallOnSidePane();
});

When('clicks on Unistall button present in popup with header message Uninstall Operator?', () => {
  cy.alertTitleShouldBe('Uninstall Operator?');
  cy.get(operatorsObj.uninstallPopup.uninstall).click();
});

When('user navigates to installed operators page in Admin perspecitve', () => {
  operatorsPage.navigateToInstalloperatorsPage();
});

When('clicks kantive eventing provided api pressent in kantive serverless operator', () => {
  cy.get('a[title="knativeeventings.operator.knative.dev"]').click();
});

When('click Create Kantive Eventing button present in kantive Eventing tab', () => {
  cy.titleShouldBe('Knative Eventings');
  cy.get('[data-test="yaml-create"]').click();
});

When('click on create button', () => {
  cy.get('[type="submit"]').click();
});

When('user search and installs the kantive Camel operator with default values', () => {
  operatorsPage.searchOperator('OpenShift Serverless Operator');
  operatorsPage.selectOperator(operators.knativeCamelOperator);
  operatorsPage.verifySiedPane();
  operatorsPage.clickInstallOnSidePane();
  operatorsPage.verifySubscriptionPage('Knative Apache Camel Operator');
  operatorsPage.installOperator();
});

When('user installs the Eclipse che operator with default values', () => {
  operatorsPage.installOperator();
});

Then('serverless tab displays in navigation menu of admin page', () => {
  // TODO: implement step
});

Then('Event sources card display in +Add page in dev perspecitve', () => {
  perspective.switchTo(switchPerspective.Developer);
  naviagteTo(devNavigationMenu.Add);
  addPage.verifyCard('Event Source');
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
