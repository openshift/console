import { commonFlows } from '../views/common';
import { createStore, Providers, testName, StoreType } from '../views/store';
import { checkErrors } from '../../../integration-tests-cypress/support';

describe('Tests creation of Namespace Stores', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
  });

  after(() => {
    cy.logout();
  });

  afterEach(() => {
    cy.byLegacyTestID('actions-menu-button').click();
    cy.log('Deleting namespace store');
    cy.byTestActionID('Delete Namespace Store').click();
    cy.byTestID('confirm-action').click();
    cy.log('Deleting secrets');
    cy.exec(`oc delete secrets ${testName}-secret -n openshift-storage`);
    checkErrors();
  });

  beforeEach(() => {
    cy.visit('/');
    commonFlows.navigateToOCS();
    cy.byLegacyTestID('horizontal-link-Namespace Store').click();
    cy.byTestID('item-create').click();
  });

  it('Test creation of AWS namespace store', () => {
    createStore(Providers.AWS, StoreType.NamespaceStore);
    cy.byLegacyTestID('resource-title').contains(testName);
  });

  it('Test creation of Azure namespace store', () => {
    createStore(Providers.AZURE, StoreType.NamespaceStore);
    cy.byLegacyTestID('resource-title').contains(testName);
  });

  it('Test creation of S3 Endpoint Type', () => {
    createStore(Providers.S3, StoreType.NamespaceStore);
    cy.byLegacyTestID('resource-title').contains(testName);
  });
});
