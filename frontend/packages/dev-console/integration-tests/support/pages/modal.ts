import { modal } from '@console/cypress-integration-tests/views/modal';
import { eventSourcePO } from '../pageObjects';

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

export const addSubscription = {
  enterSubscriberName: (name: string) =>
    cy
      .get('#form-input-metadata-name-field')
      .clear()
      .type(name),
  selectKnativeService: (knativeService: string = 'nodejs-ex-git') => {
    cy.get('[id$="subscriber-ref-name-field"]').click();
    cy.get('li')
      .contains(knativeService)
      .click();
  },
};

export const editAnnotations = {
  add: () => cy.byTestID('add-button').click(),
  enterKey: (key: string) => {
    cy.byTestID('pairs-list-name')
      .last()
      .type(key);
  },
  enterValue: (value: string) =>
    cy
      .byTestID('pairs-list-value')
      .last()
      .type(value),
  removeAnnotation: (annotationKey: string) => {
    cy.byTestID('pairs-list-name').each(($el, index) => {
      if ($el.prop('value').includes(annotationKey)) {
        cy.get('button[data-test="delete-button"]')
          .eq(index)
          .click();
      }
    });
  },
};

export const setTrafficDistribution = {
  add: () => cy.byTestID('add-action').click(),
  enterSplit: (split: string) =>
    cy
      .get('[id$="percent-field"]')
      .last()
      .clear()
      .type(split),
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
    cy.byLegacyTestID('application-form-app-input')
      .clear()
      .type(appName);
  },
  enterApplicationName: (appName: string) => {
    cy.byLegacyTestID('application-form-app-input').type(appName);
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
