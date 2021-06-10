import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { topologyPage, projectNameSpace } from '../../pages';

When('user enters project name as {string} in Create Project modal', (projectName: string) => {
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.enterProjectName(`${projectName}-${timestamp}-ns`);
  Cypress.env('NAMESPACE', `${projectName}-${timestamp}-ns`);
});

When('user clicks Create button present in Create Project modal', () => {
  modal.submit();
});

Then('modal will get closed', () => {
  modal.shouldBeClosed();
});

Then('topology page displays with the empty state', () => {
  topologyPage.verifyNoWorkLoadsText('No resources found');
});

When('user selects the Create Project option from Projects dropdown on top navigation bar', () => {
  projectNameSpace.selectCreateProjectOption();
  cy.testA11y('Create Project Modal');
});
