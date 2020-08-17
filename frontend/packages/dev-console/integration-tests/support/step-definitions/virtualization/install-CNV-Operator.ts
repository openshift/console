import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { operatorsPage, operatorsObj } from '../../pages/operators_page';
import { operators } from '../../constants/global';
import { addPage } from '../../pages/add_page';

Given('user is at Installed Operator page', () => {
  operatorsPage.navigateToInstalloperatorsPage();
});

When('clicks on the OpenShift Virtualization Operator card', () => {
  operatorsPage.selectOperator(operators.virtualizationOperator);
});

When('user installs the OpenShift Virtualization operator with default values', () => {
  operatorsPage.verifySubscriptionPage('Container-native virtualization Operator');
  operatorsPage.installOperator();
});

When('user clicks on OpenShift Virtualization Operator', () => {
  cy.get(operatorsObj.installOperators.operatorsNameRow).contains('OpenShift Virtualization').click();
});

When('user clicks on CNV Operator Deployment tab', () => {
  cy.byLegacyTestID('horizontal-link-CNV Operator Deployment').click();
});

When('user clicks on the Create HyperConverged Cluster button', () => {
  cy.byTestID('yaml-create').click();
  operatorsPage.verifySubscriptionPage('CNV Operator Deployment');
});

When('user clicks on Create button', () => {
  operatorsPage.clickOnCreate();
});

Then('user will see a HyperConverged Cluster created', () => {
  cy.get('[data-test-operand-link="kubevirt-hyperconverged"]').should('be.visible');
});

Then('user will see Virtualization item under Workloads', () => {
  
});

Then('user will see Import Virtual Machine Card on Add page', () => {
  addPage.verifyCard('Import Virtual Machine');
}); 