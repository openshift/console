import { commonFlows } from '../views/common';
import { store, Providers, testName, StoreType } from '../views/store';
import { checkErrors } from '../../../integration-tests-cypress/support';

describe('Tests creation of Namespace Stores', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    cy.install();
    store.setStoreType(StoreType.NamespaceStore);
  });

  after(() => {
    cy.logout();
  });

  afterEach(() => {
    cy.byLegacyTestID('actions-menu-button').click();
    cy.byTestActionID('Delete Namespace Store').click();
    cy.byTestID('confirm-action').click();
    checkErrors();
  });

  beforeEach(() => {
    cy.visit('/');
    commonFlows.navigateToOCS();
    cy.byLegacyTestID('horizontal-link-Namespace Store').click();
    cy.byTestID('item-create').click();
  });

  it('Test creation of AWS namespace store', () => {
    store.createStore(Providers.AWS);
    cy.byLegacyTestID('resource-title').contains(testName);
    cy.exec(`oc delete secrets ${testName}-secret -n openshift-storage`);
  });

  it('Test creation of Azure namespace store', () => {
    store.createStore(Providers.AZURE);
    cy.byLegacyTestID('resource-title').contains(testName);
    cy.exec(`oc delete secrets ${testName}-secret -n openshift-storage`);
  });

  it('Test creation of S3 Endpoint Type', () => {
    store.createStore(Providers.S3);
    cy.byLegacyTestID('resource-title').contains(testName);
    cy.exec(`oc delete secrets ${testName}-secret -n openshift-storage`);
  });
});
