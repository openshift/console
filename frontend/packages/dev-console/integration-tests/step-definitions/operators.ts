import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { operatorsPage } from '../support/pages/operators_page';
import { loginPage } from '../support/pages/login_page';
import { perspective } from '../support/pages/app';

Given('user logged into the openshift application', () => {
  loginPage.loginWithValidCredentials('kubeadmin', 'VpTYd-4YMhN-p3Q8f-PfNsz');
  loginPage.checkLoginSuccess();
});

Given('user is at admin perspecitve', () => {
  perspective.switchToAdmin();
  cy.get('div[data-test-id="perspective-switcher-menu"]')
    .find('h1')
    .should('contain.text', 'Administrator');
});

Given('user is at Operator Hub page with the header name {string}', (headerName) => {
  operatorsPage.navigateToOperaotorHubPage();
  cy.get('[data-test-id="resource-title"]').should('contain.text', headerName);
});

When('user searches for {string}', (operatorName) => {
  operatorsPage.searchOperator(operatorName);
});

When('clicks OpenShift Pipelines Operator card on Operator Hub page', () => {
  cy.get(
    '[data-test="openshift-pipelines-operator-rh-redhat-operators-openshift-marketplace"]',
  ).click();
});

When('click install button present on the right side pane', () => {
  cy.get('[role="dialog"]').should('be.exist');
  cy.get('[data-test-id="operator-install-btn"]').click();
});

Then('OpenShift Pipeline operator subscription page will be displayed', () => {
  operatorsPage.verifyPipelineOperatorSubscriptionPage();
});

Given('user is at OpenShift Pipeline Operator subscription page', () => {
  operatorsPage.navigateToOperaotorHubPage();
  cy.get('[data-test-id="resource-title"]').should('contain.text', 'OperatorHub');
  operatorsPage.searchOperator('OpenShift Pipelines Operator');
  cy.get(
    '[data-test="openshift-pipelines-operator-rh-redhat-operators-openshift-marketplace"]',
  ).click();
  cy.get('[role="dialog"]').should('be.exist');
  cy.get('[data-test-id="operator-install-btn"]').click();
  operatorsPage.verifyPipelineOperatorSubscriptionPage();
});

When('user installs the pipeline operator with default values', () => {
  cy.get('button.pf-c-button.pf-m-primary')
    .contains('Install')
    .click();
});

Then('page redirects to Installed operators', () => {
  cy.get('[data-test-id="resource-title"]').should('have.text', 'Installed Operators');
});

Then('Installed operators page will contain {string}', (operatorName) => {
  operatorsPage.verifyInstalledOperator(operatorName);
});
