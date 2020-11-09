import * as _ from 'lodash';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { checkErrors } from '../../../integration-tests-cypress/support';

describe('Subscribe to OCS Operator from OperatorHub', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.clickNavLink(['Operators', 'OperatorHub']);
    cy.byTestID('search-operatorhub').type('Openshift Container Storage');
    cy.byTestID('ocs-operator-redhat-operators-openshift-marketplace').click();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('Subscribes to OCS Operator successfully', () => {
    cy.byLegacyTestID('operator-install-btn').click({ force: true });
    cy.byTestID('Operator recommended namespace:-radio-input').should('be.checked');
    cy.byTestID('enable-monitoring').click();
    cy.byTestID('install-operator').click();
    cy.byTestID('success-icon', { timeout: 180000 }).should('be.visible');
    cy.exec('oc get project openshift-storage -o json').then((res) => {
      const obj = JSON.parse(res.stdout);
      expect(obj.metadata.labels?.['openshift.io/cluster-monitoring']).toEqual('true');
    });
    // Rook, Noobaa and OCS pod should come up after installation.
    cy.exec('oc get po -n openshift-storage -o json').then((res) => {
      const { items } = JSON.parse(res.stdout);
      expect(
        items.find((item) => _.startsWith(item.metadata.name, 'noobaa-operator')),
      ).toBeDefined();
      expect(items.find((item) => _.startsWith(item.metadata.name, 'ocs-operator'))).toBeDefined();
      expect(
        items.find((item) => _.startsWith(item.metadata.name, 'rook-ceph-operator')),
      ).toBeDefined();
    });
  });
});
