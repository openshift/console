import { addOptions } from '../../constants/add';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { eventSourcePO } from '../../pageObjects/add-flow-po';
import { addPage } from './add-page';

export const eventSourcesPage = {
  verifyTitle: (title: string = 'Event Sources') => detailsPage.titleShouldContain(title),
  search: (type: string) => cy.get(eventSourcePO.search).type(type),
  verifyEventSourceType: (eventSourceName: string) => {
    cy.get(`button[aria-label="${eventSourceName}"]`).should('be.visible');
  },
  clickEventSourceType: (eventSourceName: string) => {
    // app.waitForLoad();
    cy.get(`button[aria-label="${eventSourceName}"]`).click();
  },
  clickCreate: () => cy.byLegacyTestID('submit-button').click(),
  clickCancel: () => cy.byLegacyTestID('reset-button').click(),
  selectServiceType: (serviceAccountName: string = 'default') => {
    cy.get(eventSourcePO.apiServerSource.serviceAccountName).click();
    cy.get('li')
      .contains(serviceAccountName)
      .click();
  },
  selectKnativeService: (knativeService: string) => {
    cy.get(eventSourcePO.apiServerSource.sinkResource).click();
    cy.get(`[id*=${knativeService}-link]`).click();
  },
  selectMode: (mode: string) => {
    cy.get(eventSourcePO.apiServerSource.mode).click();
    cy.get(`[data-test-dropdown-menu="${mode}"]`).click();
  },
  enterEventSourceName: (eventSourceName: string) =>
    cy
      .get(eventSourcePO.sinkBinding.name)
      .clear()
      .type(eventSourceName),
  createSinkBinding: (
    eventSourceName: string,
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
  ) => {
    addPage.selectCardFromOptions(addOptions.EventSource);
    eventSourcesPage.clickEventSourceType('Sink Binding');
    cy.get(eventSourcePO.sinkBinding.apiVersion).type(apiVersion);
    cy.get(eventSourcePO.sinkBinding.kind).type(kind);
    cy.get(eventSourcePO.sinkBinding.resource).click();
    eventSourcesPage.selectKnativeService('nodejs-ex-git');
    cy.get(eventSourcePO.sinkBinding.name)
      .clear()
      .type(eventSourceName);
    eventSourcesPage.clickCreate();
  },
  createEventSource: (
    eventSourceName: string,
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
  ) => {
    addPage.selectCardFromOptions(addOptions.EventSource);
    eventSourcesPage.clickEventSourceType(eventSourceName);
    cy.get(eventSourcePO.sinkBinding.apiVersion).type(apiVersion);
    cy.get(eventSourcePO.sinkBinding.kind).type(kind);
    eventSourcesPage.clickCreate();
  },
};
