import { eventSourcePO } from '../pageObjects/add-flow-po';
import { modal } from '../../../../integration-tests-cypress/views/modal';

export const editLabels = {
  enterLabel: (labelName: string) =>
    cy
      .byTestID('tags-input')
      .type(labelName)
      .type('{enter}'),
  numberOfLabels: () => {
    return cy.get('tags-input span.tag-item__content');
  },
  removeLabel: (labelName: string) => {
    cy.get('tags-input span.tag-item')
      .contains(labelName)
      .next('a.remove-button')
      .click();
  },
};

export const editAnnotations = {
  add: () => cy.byTestID('add-button').click(),
  enterKey: (key: string) => {
    cy.get('input[placeholder="key"]')
      .last()
      .type(key);
  },
  enterValue: (value: string) =>
    cy
      .get('input[placeholder="value"]')
      .last()
      .type(value),
  removeAnnotation: (annotationKey: string) => {
    cy.get(`div.row input[placeholder="key"]`).each(($el, index) => {
      if ($el.prop('value').includes(annotationKey)) {
        cy.get('button[data-test="delete-button"]')
          .eq(index)
          .click();
      }
    });
  },
};

export const setTrafficDistribution = {
  add: () =>
    cy
      .get('form [type="button"]')
      .contains('Add')
      .click(),
  enterSplit: (split: string) => cy.get('#form-input-trafficSplitting-0-percent-field').type(split),
  selectRevision: (revisionName: string) => {
    cy.get('#form-dropdown-trafficSplitting-0-revisionName-field').click();
    cy.get(`[data-test-dropdown-menu^="${revisionName}"]`).click();
  },
};

export const editApplicationGrouping = {
  selectApplication: (appName: string) => {
    cy.get('#form-dropdown-application-name-field').click();
    cy.get(`[id="${appName}-link"]`).click();
  },
  createApplication: (appName: string) => {
    cy.get('#form-dropdown-application-name-field').click();
    cy.byLegacyTestID('application-form-app-input')
      .clear()
      .type(appName);
  },
};

export const deleteApplication = {
  enterApplication: (appName: string) =>
    cy
      .get('#form-input-resourceName-field')
      .clear()
      .type(appName),
  clickDelete: () => {
    cy.byTestID('confirm-action')
      .should('be.enabled')
      .click();
    cy.get('form').should('not.exist');
  },
  deleteApp: () => {
    cy.get('p strong').then((ele) => {
      deleteApplication.enterApplication(ele.text());
      modal.submit();
    });
  },
};

export const deleteRevision = {
  verifyMessage: (message: string) => cy.get('form p').should('contain.text', message),
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
    cy.byLegacyTestID('sink-section-uri')
      .clear()
      .type(uri);
  },
  verifyResourceDropDown: () =>
    cy.get(eventSourcePO.sinkBinding.sink.resource.resourceDropdown).should('be.visible'),
};

export const editPodCount = {
  enterPodCount: (podCount: string) => {
    cy.get('input[type="number"]')
      .clear()
      .type(podCount);
  },
};
