import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { devNavigationMenu } from '../constants';
import { pagePO } from '../pageObjects';
import { configMapPO } from '../pageObjects/config-map-po';
import { createForm, navigateTo } from './app';

export const configMapPage = {
  createConfigMap: (
    configMapName: string,
    key: string = 'test-key',
    value: string = 'test-value',
  ) => {
    navigateTo(devNavigationMenu.ConfigMaps);
    cy.get(pagePO.create).should('be.visible').click();
    cy.get(configMapPO.name).should('be.visible').clear().type(configMapName);
    cy.get(configMapPO.initialKey).scrollIntoView().should('be.visible').clear().type(key);
    cy.get(configMapPO.value).scrollIntoView().should('be.visible').clear().type(value);
    createForm.clickCreate();
    detailsPage.titleShouldContain(configMapName);
  },
};
