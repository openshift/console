import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { projectNameSpace, naviagteTo, perspective } from '../../pages/app';
import { devNavigationMenu, switchPerspective } from '../../constants/global';
import { addPage } from '../../pages/add-flow/add-page';
import { operatorsPage, operatorsObj } from '../../pages/operators-page';

Given('user is at the new project namespace {string}', (namespace: string) => {
  projectNameSpace.createNewProject(namespace);
});

Given('cluster is not installed with any operators', () => {
  perspective.switchTo(switchPerspective.Administrator);
  operatorsPage.navigateToInstalloperatorsPage();
  cy.get(operatorsObj.installOperators.noOperatorFoundMessage).should('have.text', 'No Operators Found');
});

When('user selects Add option from left side navigation menu', () => {
  naviagteTo(devNavigationMenu.Add);
});

Then('page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards', () => {
  addPage.verifyCard('From Git');
  addPage.verifyCard('Container Image');
  addPage.verifyCard('From Dockerfile');
  addPage.verifyCard('YAML');
  addPage.verifyCard('From Catalog');
  addPage.verifyCard('Database');
  addPage.verifyCard('Helm Chart');
});

Then('user is able to see message {string} on Add page', (message: string) => {
  addPage.verifyNoWorkLoadsText(message);
});

Then('user is able to see Pipeline card on Git form', () => {
  addPage.verifyCard('Pipeline');
});

Then('user is able to see {string} card on Add page', (cardName: string) => {
  addPage.verifyCard(cardName);
});
