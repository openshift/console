import { Given, When } from 'cypress-cucumber-preprocessor/steps';
import { createForm } from '@console/dev-console/integration-tests/support/pages/app';
import { operatorsPage } from '@console/dev-console/integration-tests/support/pages/operators-page';

Given('user is at eventing page', () => {
  operatorsPage.navigateToEventingPage();
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});
