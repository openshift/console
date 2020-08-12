import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { projectNameSpace, naviagteTo, perspective } from '../../pages/app';
import { devNavigationMenu, switchPerspective } from '../../constants/global';
import { addPage } from '../../pages/add_page';
import { operatorsPage, operatorsObj } from '../../pages/operators_page';

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

Given('cluster is installed with pipeline operator', () => {
  
});

Given('cluster is installed with serverless operator', () => {
  // TODO: implement step
});

Then('message displays as {string}', (a: string) => {
  cy.log(a)
  // TODO: implement step
});

Then('page contains Pipeline card', () => {
  addPage.verifyCard('Pipeline');
});

Then('page contains Operator Backed card', () => {
  addPage.verifyCard('Operator Backed');
});

Then('page contains Event Soruces card', () => {
  addPage.verifyCard('Event Sources');
});
