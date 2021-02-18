import { addOptions, eventSourceCards } from '../../constants/add';
import { catalogPO, eventSourcePO } from '../../pageObjects/add-flow-po';
import { addPage } from './add-page';
import { createForm } from '../app';
import { topologyPage } from '../topology/topology-page';

export const eventSourcesPage = {
  search: (type: string) => cy.get(eventSourcePO.search).type(type),
  verifyEventSourceType: (eventSourceName: string) => {
    cy.byTestID(`EventSource-${eventSourceName}`).should('be.visible');
  },
  clickEventSourceType: (eventSourceName: string | eventSourceCards) => {
    cy.byTestID(`EventSource-${eventSourceName}`)
      .should('be.visible')
      .click();
  },
  clickCreateEventSourceOnSidePane: () => {
    cy.get(catalogPO.sidePane.createApplication).click({ force: true });
  },
};

export const createEventSourcePage = {
  enterEventSourceName: (eventSourceName: string) =>
    cy
      .get(eventSourcePO.sinkBinding.name)
      .clear()
      .type(eventSourceName),
  enterApiVersion: (apiVersion: string) =>
    cy
      .get(eventSourcePO.sinkBinding.apiVersion)
      .clear()
      .type(apiVersion),
  enterKind: (kind: string) =>
    cy
      .get(eventSourcePO.sinkBinding.kind)
      .clear()
      .type(kind),
  selectServiceType: (serviceAccountName: string = 'default') => {
    cy.get(eventSourcePO.apiServerSource.serviceAccountName).click();
    cy.get('li')
      .contains(serviceAccountName)
      .click();
  },
  selectKnativeService: (knativeService: string) => {
    cy.get(eventSourcePO.sinkBinding.sink.resource.resourceDropdown).click();
    cy.get(`[id*=${knativeService}-link]`).click();
  },
  selectMode: (mode: string) => {
    cy.get(eventSourcePO.apiServerSource.mode).click();
    cy.get(`[data-test-dropdown-menu="${mode}"]`).click();
  },
  createSinkBinding: (
    eventSourceName: string,
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
    knativeServiceName: string = 'nodejs-ex-git',
  ) => {
    addPage.selectCardFromOptions(addOptions.EventSource);
    eventSourcesPage.clickEventSourceType('Sink Binding');
    eventSourcesPage.clickCreateEventSourceOnSidePane();
    createEventSourcePage.enterApiVersion(apiVersion);
    createEventSourcePage.enterKind(kind);
    cy.get(eventSourcePO.sinkBinding.sink.resourceRadioButton).click();
    createEventSourcePage.selectKnativeService(knativeServiceName);
    createEventSourcePage.enterEventSourceName(eventSourceName);
    createForm.clickCreate();
    topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
  },
  createEventSource: (
    eventSourceName: string,
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
  ) => {
    addPage.selectCardFromOptions(addOptions.EventSource);
    eventSourcesPage.clickEventSourceType(eventSourceName);
    createEventSourcePage.enterApiVersion(apiVersion);
    createEventSourcePage.enterKind(kind);
    createForm.clickCreate();
    topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
  },
};
