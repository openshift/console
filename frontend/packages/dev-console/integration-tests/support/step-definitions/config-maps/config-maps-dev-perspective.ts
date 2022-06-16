import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { devNavigationMenu } from '../../constants';
import { pagePO } from '../../pageObjects';
import { configMapPO } from '../../pageObjects/config-map-po';
import { createForm, kebabMenu, navigateTo } from '../../pages';
import { configMapPage } from '../../pages/config-maps';

Given('user is at ConfigMaps page', () => {
  navigateTo(devNavigationMenu.ConfigMaps);
});

When('user clicks on Create ConfigMap', () => {
  cy.get(pagePO.create)
    .should('be.visible')
    .click();
});

When('user enters name of config map as {string}', (name: string) => {
  cy.get(configMapPO.name)
    .should('be.visible')
    .clear()
    .type(name);
});

When('user enters key as {string}', (key: string) => {
  cy.get(configMapPO.initialKey)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(key);
});

When('user enters value as {string}', (value: string) => {
  cy.get(configMapPO.value)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(value);
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});

Then('user can see {string} in ConfigMap details page', (configMapName: string) => {
  detailsPage.titleShouldContain(configMapName);
});

Given('user has created ConfigMap {string}', (configMapName: string) => {
  configMapPage.createConfigMap(configMapName);
});

When('user clicks on kebab menu of ConfigMap {string}', (configMapName: string) => {
  kebabMenu.openKebabMenu(configMapName);
});

When('user clicks on Edit ConfigMap', () => {
  cy.byTestActionID('Edit ConfigMap').click({ force: true });
});

When('user clicks on add key-value', () => {
  cy.get(configMapPO.addKeyValue)
    .first()
    .should('be.visible')
    .click();
});

When('user enters new key as {string}', (key: string) => {
  cy.get(configMapPO.secondKey)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(key);
});

When('user clicks on Save button', () => {
  createForm.clickCreate();
});

Then('user can see {string} under Data section', (key: string) => {
  cy.get('.co-m-pane__body')
    .contains(key)
    .should('be.visible');
});
