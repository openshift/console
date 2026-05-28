import { eventSourcePO } from '../pageObjects';

export const editLabels = {
  enterLabel: (labelName: string) => cy.byTestID('tags-input').type(labelName).type('{enter}'),
  numberOfLabels: () => {
    return cy.get('tags-input span.tag-item-content');
  },
  removeLabel: (labelName: string) => {
    cy.get(`[aria-label="Close ${labelName}"]`).click();
  },
};

export const addSubscription = {
  enterSubscriberName: (name: string) =>
    cy.get('[id="form-input-formData-metadata-name-field"]').clear().type(name),
  selectKnativeService: (knativeService: string = 'nodejs-ex-git') => {
    cy.get('[id$="subscriber-ref-name-field"]').click();
    cy.get('[data-test="console-select-item"]').contains(knativeService).click();
  },
};

export const editAnnotations = {
  add: () => cy.byTestID('add-button').click(),
  enterKey: (key: string) => {
    cy.byTestID('pairs-list-name').last().type(key);
  },
  enterValue: (value: string) => cy.byTestID('pairs-list-value').last().type(value),
  removeAnnotation: (annotationKey: string) => {
    cy.byTestID('pairs-list-name').each(($el, index) => {
      if ($el.prop('value').includes(annotationKey)) {
        cy.get('button[data-test="delete-button"]').eq(index).click();
      }
    });
  },
};

export const setTrafficDistribution = {
  add: () => cy.byTestID('add-action').click(),
  enterSplit: (split: string) => cy.get('[id$="percent-field"]').last().clear().type(split),
  selectRevision: (revisionName: string) => {
    cy.get('[id$="revisionName-field"]').click();
    cy.get(`[data-test-dropdown-menu^="${revisionName}"]`).click();
  },
};

export const editApplicationGrouping = {
  clickCreateApplication: () => {
    cy.byTestDropDownMenu('#CREATE_APPLICATION_KEY#').click();
  },
  selectApplication: (appName: string) => {
    cy.get('#form-dropdown-application-name-field').click();
    cy.get(`[id="${appName}-link"]`).click();
  },
  createApplication: (appName: string) => {
    cy.get('#form-dropdown-application-name-field').click();
    editApplicationGrouping.clickCreateApplication();
    cy.byLegacyTestID('application-form-app-input').clear().type(appName);
  },
  enterApplicationName: (appName: string) => {
    cy.byLegacyTestID('application-form-app-input').type(appName);
  },
};

export const deleteRevision = {
  verifyMessage: (message: string) => cy.get('[role="dialog"] p').should('contain.text', message),
  clickOK: () => cy.byLegacyTestID('modal-cancel-action').click(),
};

export const moveSink = {
  selectResource: (resourceName: string) => {
    cy.get(eventSourcePO.sinkBinding.sink.resourceRadioButton).should('be.checked');
    cy.get(eventSourcePO.sinkBinding.sink.resource.resourceDropdown).click();
    cy.get(`[id*="${resourceName}-link"]`).click();
  },
  enterURI: (uri: string) => {
    cy.get(eventSourcePO.sinkBinding.sink.uriRadioButton).should('be.checked');
    cy.byLegacyTestID('sink-section-uri').clear().type(uri);
  },
  verifyResourceDropDown: () =>
    cy.get(eventSourcePO.sinkBinding.sink.resource.resourceDropdown).should('be.visible'),
};
