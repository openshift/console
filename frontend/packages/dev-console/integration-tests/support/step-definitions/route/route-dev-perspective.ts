import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { devNavigationMenu } from '../../constants';
import { pagePO } from '../../pageObjects';
import { routesPO } from '../../pageObjects/route-po';
import { createForm, kebabMenu, navigateTo } from '../../pages';
import { routesPage } from '../../pages/routes';

Given('user is at Routes page', () => {
  navigateTo(devNavigationMenu.Routes);
});

When('user clicks on Create Route', () => {
  cy.get(pagePO.create).should('be.visible').click();
});

When('user enters name of route as {string}', (name: string) => {
  cy.get(routesPO.name).should('be.visible').clear().type(name);
});

When('user enters Hostname of route as {string}', (hostname: string) => {
  cy.get(routesPO.hostname).scrollIntoView().should('be.visible').clear().type(hostname);
});

When('user selects service as {string}', (serviceName: string) => {
  cy.get(routesPO.service).scrollIntoView().should('be.visible').click();
  cy.byTestDropDownMenu(serviceName).should('be.visible').click();
});

When('user selects target port as {string}', (targetPort: string) => {
  cy.get(routesPO.targetPort).scrollIntoView().should('be.visible').click();
  const port: string = targetPort.substring(0, 4);
  cy.log(port);
  cy.byTestDropDownMenu(`${port}-tcp`).should('be.visible').click();
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});

Then('user sees routes details page of {string}', (routeName: string) => {
  cy.get(pagePO.breadcrumb).contains('Routes').should('be.visible');
  detailsPage.titleShouldContain(routeName);
});

Given(
  'user has created route named {string} with service {string} at target port {string}',
  (routeName, serviceName, targetPort: string) => {
    routesPage.createRoute(routeName, serviceName, targetPort);
  },
);

When('user clicks on kebab menu of Route {string}', (routeName: string) => {
  kebabMenu.openKebabMenu(routeName);
});

When('user clicks on Edit Route', () => {
  cy.byTestActionID('Edit Route').click({ force: true });
});

When('user changes Hostname to {string}', (newHost: string) => {
  cy.get(routesPO.hostname).scrollIntoView().should('be.visible').clear().type(newHost);
});

When('user clicks on Save button', () => {
  modal.submit();
});

Then('user sees Host as {string}', (host: string) => {
  cy.byTestSelector('details-item-value__Host').should('be.visible').and('contain', host);
});
