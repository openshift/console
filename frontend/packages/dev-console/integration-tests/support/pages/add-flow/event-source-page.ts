import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';
import { addOptions, devNavigationMenu, eventSourceCards } from '../../constants';
import { catalogPO, eventSourcePO, topologyPO } from '../../pageObjects';
import { createForm, navigateTo } from '../app';
import { addPage } from './add-page';

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
    cy.selectByAutoCompleteDropDownText(
      eventSourcePO.apiServerSource.serviceAccountName,
      serviceAccountName,
    );
  },
  selectKnativeService: (knativeService: string) => {
    cy.get(eventSourcePO.sinkBinding.sink.resource.resourceDropdown).click();
    cy.get(`[id*=${knativeService}-link]`).click();
  },
  selectMode: (mode: string) => {
    cy.get(eventSourcePO.apiServerSource.mode).click();
    cy.get(`[data-test-dropdown-menu="${mode}"]`).click();
  },
  enterURI: (uri: string) => {
    cy.get(eventSourcePO.sinkBinding.sink.uri.uriName).type(uri);
  },
  selectSinkOption: (sinkOption: string) => {
    if (sinkOption === 'URI') {
      cy.get(eventSourcePO.sinkBinding.sink.uriRadioButton).click();
    } else if (sinkOption === 'Resource') {
      cy.get(eventSourcePO.sinkBinding.sink.resourceRadioButton).click();
    }
  },
  createSinkBinding: (
    eventSourceName: string,
    knativeServiceName: string = 'nodejs-ex-git',
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
  ) => {
    addPage.selectCardFromOptions(addOptions.EventSource);
    eventSourcesPage.clickEventSourceType(eventSourceCards.SinkBinding);
    eventSourcesPage.clickCreateEventSourceOnSidePane();
    createEventSourcePage.enterApiVersion(apiVersion);
    createEventSourcePage.enterKind(kind);
    createEventSourcePage.selectSinkOption('Resource');
    createEventSourcePage.selectKnativeService(knativeServiceName);
    createEventSourcePage.enterEventSourceName(eventSourceName);
    createForm.clickCreate();
    topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
  },
  createEventSource: (
    eventSourceName: string | eventSourceCards,
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
    knativeServiceName: string = 'nodejs-ex-git',
  ) => {
    if (eventSourceName === eventSourceCards.SinkBinding) {
      createEventSourcePage.createSinkBinding(
        eventSourceCards.SinkBinding,
        apiVersion,
        kind,
        knativeServiceName,
      );
    } else {
      addPage.selectCardFromOptions(addOptions.EventSource);
      eventSourcesPage.clickEventSourceType(eventSourceName);
      createEventSourcePage.enterApiVersion(apiVersion);
      createEventSourcePage.enterKind(kind);
      createForm.clickCreate();
      topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
      cy.log(`${eventSourceName} event source created`);
    }
  },
  createSinkBindingIfNotExistsOnTopologyPage: (
    eventSourceName: string,
    knativeServiceName: string = 'nodejs-ex-git',
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
  ) => {
    navigateTo(devNavigationMenu.Topology);
    topologyPage.waitForLoad();
    cy.get('body').then(($body) => {
      if ($body.find(topologyPO.emptyStateIcon).length) {
        navigateTo(devNavigationMenu.Add);
        createEventSourcePage.createSinkBinding(
          eventSourceName,
          knativeServiceName,
          apiVersion,
          kind,
        );
        topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
      } else {
        topologyPage.search(eventSourceName);
        cy.get('body').then(($node) => {
          if ($node.find(topologyPO.highlightNode).length) {
            cy.log(`Event Source: "${eventSourceName}" is already available`);
          } else {
            navigateTo(devNavigationMenu.Add);
            createEventSourcePage.createSinkBinding(
              eventSourceName,
              knativeServiceName,
              apiVersion,
              kind,
            );
            topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
          }
        });
      }
    });
  },
  createSinkBindingWithURI: (
    eventSourceName: string,
    uri: string = 'http://cluster.example.com/svc',
    apiVersion: string = 'batch/v1',
    kind: string = 'Job',
  ) => {
    addPage.selectCardFromOptions(addOptions.EventSource);
    eventSourcesPage.clickEventSourceType(eventSourceCards.SinkBinding);
    eventSourcesPage.clickCreateEventSourceOnSidePane();
    createEventSourcePage.enterApiVersion(apiVersion);
    createEventSourcePage.enterKind(kind);
    createEventSourcePage.selectSinkOption('URI');
    createEventSourcePage.enterURI(uri);
    createEventSourcePage.enterEventSourceName(eventSourceName);
    createForm.clickCreate();
    topologyPage.verifyWorkloadInTopologyPage(eventSourceName);
  },
};
