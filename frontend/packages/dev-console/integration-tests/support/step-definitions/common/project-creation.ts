import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { projectNameSpace } from '../../pages/app';
import { cardTitle } from '../../pageObjects/add-flow-po';
import { modal } from '../../../../../integration-tests-cypress/views/modal';

When('user enters project name as {string} in Create Project modal', (projectName: string) => {
  const d = new Date();
  const timestamp = d.getTime();
  projectNameSpace.enterProjectName(`${projectName}-${timestamp}-ns`);
});

When('user clicks Create button present in Create Project modal', () => {
  modal.submit();
});

Then('modal will get closed', () => {
  modal.shouldBeClosed();
});

Then('topology page displays with message {string}', (message: string) => {
  projectNameSpace.verifyMessage(message);
  // Bug: 1890678 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Topology Page with cards');
});

Then('topology page have cards from Add page', () => {
  cy.get(cardTitle).should('be.visible');
});

When('user selects the Create Project option from Projects dropdown on top navigation bar', () => {
  projectNameSpace.selectCreateProjectOption();
  // Bug: 1890678 is created related to Accesibiity violation - Until bug fix, below line is commented to execute the scripts in CI
  // cy.testA11y('Create Project Modal');
});
