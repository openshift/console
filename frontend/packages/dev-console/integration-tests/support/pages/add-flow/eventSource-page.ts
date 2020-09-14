import { addPage } from "../add-flow/add-page";
import { addOptions } from "../../constants/add";
import { app } from "../app";

export const eventSourceObj = {
    search: '[placeholder="Filter by type..."]',
    apiServerSource: {
      apiVersion: 'input[placeholder="apiversion"]',
      kind: 'input[placeholder="kind"]',
      serviceAccountName: '#form-ns-dropdown-data-apiserversource-serviceAccountName-field',
      sinkResource: '#form-ns-dropdown-sink-name-field',
      name: '[data-test-id="application-form-app-name"]',
      mode: '#form-dropdown-data-apiserversource-mode-field',
    },
    sinkBinding: {
      apiVersion: '[data-test-id="sinkbinding-apiversion-field"]',
      kind: '[data-test-id="sinkbinding-kind-field"]',
      sinkResource: '#form-ns-dropdown-sink-name-field',
      name: '[data-test-id="application-form-app-name"]',
      resource: '#form-radiobutton-sinkType-resource-field',
      uri: '#form-radiobutton-sinkType-uri-field',
    },
  }


export const eventSourcesPage = {
    verifyTitle: (title: string = 'Event Sources') => cy.titleShouldBe(title),
    search: (type: string) => cy.get(eventSourceObj.search).type(type),
    verifyEventSourceType: (eventSourceName: string) => {
      cy.get(`button[aria-label="${eventSourceName}"]`).should('be.visible');
    },
    selectEventSourceType: (eventSourceName: string) => {
      app.waitForLoad();
      cy.get(`button[aria-label="${eventSourceName}"]`).click();
    },
    clickCreate:() => cy.byLegacyTestID('submit-button').click(),
    clickCancel:() => cy.byLegacyTestID('reset-button').click(),
    selectServiceType:(serviceAccountName: string = 'default') => {
      cy.get(eventSourceObj.apiServerSource.serviceAccountName).click();
      cy.get('li').contains(serviceAccountName).click();
    },
    selectknativeService:(knativeService: string) => {
      cy.get(eventSourceObj.apiServerSource.sinkResource).click();
      cy.get(`[id^=${knativeService}-link]`).click();
    },
    selectMode:(mode: string) => {
      cy.get(eventSourceObj.apiServerSource.mode).click();
      cy.get(`[data-test-dropdown-menu="${mode}"]`).click();
    },
    enterEventSourceName:(eventSourceName: string) => cy.get(eventSourceObj.sinkBinding.name).clear().type(eventSourceName),
    createSinkBinding:(eventSourceName: string, apiVersion:string = 'batch/v1', kind:string = 'Job') => {
      addPage.selectCardFromOptions(addOptions.EventSource);
      eventSourcesPage.selectEventSourceType("Sink Binding");
      cy.get(eventSourceObj.sinkBinding.apiVersion).type(apiVersion);
      cy.get(eventSourceObj.sinkBinding.kind).type(kind);
      cy.get(eventSourceObj.sinkBinding.resource).click();
      cy.get(eventSourceObj.sinkBinding.sinkResource).then(($el) => {
        if($el.prop('disabled') === false) {
          eventSourcesPage.selectknativeService('nodejs-ex-git');
        }
      });
      cy.get(eventSourceObj.sinkBinding.name).type(eventSourceName)
      eventSourcesPage.clickCreate();
    },
    createEventSource:(eventSourceName: string, apiVersion:string = 'batch/v1', kind:string = 'Job') => {
      addPage.selectCardFromOptions(addOptions.EventSource);
      eventSourcesPage.selectEventSourceType(eventSourceName);
      cy.get(eventSourceObj.sinkBinding.apiVersion).type(apiVersion);
      cy.get(eventSourceObj.sinkBinding.kind).type(kind);
      eventSourcesPage.clickCreate();
    }
  }