import { submitButton } from '@console/cypress-integration-tests/views/form';
import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { operator, TestOperandProps } from '../views/operator.view';

const testOperator = {
  name: 'Red Hat CodeReady Workspaces',
  operatorHubCardTestID: 'codeready-workspaces-redhat-operators-openshift-marketplace',
  installedNamespace: testName,
};

const testOperand: TestOperandProps = {
  name: 'CodeReady Workspaces Cluster',
  kind: 'CheCluster',
  tabName: 'CodeReady Workspaces Cluster',
  exampleName: `codeready-workspaces`,
  deleteURL: '/checlusters/',
};

const alertExists = (titleText: string) => {
  cy.get('.pf-c-alert__title')
    .contains(titleText)
    .should('exist');
};

const uninstallAndVerify = () => {
  cy.log('uninstall the Operator and all Operand instances');
  operator.uninstall(testOperator.name, testOperator.installedNamespace, true);

  cy.log(`verify the Operator is not installed`);
  operator.shouldNotExist(testOperator.name, testOperator.installedNamespace);

  cy.log('verify operand instance is deleted or marked for deletion');
  cy.resourceShouldBeDeleted(testName, testOperand.kind, testOperand.exampleName);
};

describe(`Testing uninstall of ${testOperator.name} Operator`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
    operator.install(
      testOperator.name,
      testOperator.operatorHubCardTestID,
      testOperator.installedNamespace,
    );
    operator.installedSucceeded(testOperator.name);
    operator.createOperand(testOperator.name, testOperand, testOperator.installedNamespace);
    cy.byTestOperandLink(testOperand.exampleName).should('exist');
    operator.operandShouldExist(testOperator.name, testOperand, testOperator.installedNamespace);
  });

  beforeEach(() => {
    operator.navToDetailsPage(testOperator.name, testOperator.installedNamespace);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`installs ${testOperator.name} Operator and ${testOperand.name} Instance, then navigates to Operator details page`, () => {
    cy.byTestSectionHeading('Provided APIs').should('exist');
    cy.byTestSectionHeading('ClusterServiceVersion details').should('exist');
    cy.byLegacyTestID('resource-summary').should('exist');
  });

  it(`attempts to uninstall the Operator, shows 'Cannot load Operands' alert`, () => {
    // return a static error response
    cy.intercept('GET', 'api/list-operands', {
      statusCode: 400, // Bad Request
      body: { error: 'Failed to list operands' },
    }).as('listOperands');

    cy.log('attempt to uninstall the Operator');
    operator.uninstallModal.open(testOperator.name, testOperator.installedNamespace);

    cy.wait('@listOperands');
    alertExists('Cannot load Operands');
    modal.cancel();
    modal.shouldBeClosed();
  });

  it(`attempts to uninstall the Operator, shows 'Error uninstalling Operator' alert`, () => {
    // invalidate the request so operator doesn't get uninstalled, as opposed to
    // letting request go thru unchanged and mocking the response
    cy.intercept('DELETE', '/api/kubernetes/apis/operators.coreos.com/', (req) => {
      // examples:
      // .../api/kubernetes/apis/operators.coreos.com/v1alpha1/namespaces/test-mpnsw/subscriptions/datagrid-foobar
      // .../api/kubernetes/apis/operators.coreos.com/v1alpha1/namespaces/test-mpnsw/clusterserviceversions/datagrid-operator.v8.2.0-foobar
      req.url = `${req.url}-foobar`;
    }).as('deleteOperatorSubscriptionAndCSV');

    cy.log('attempt to uninstall the Operator');
    operator.uninstallModal.open(testOperator.name, testOperator.installedNamespace);
    modal.submit(true);
    cy.wait('@deleteOperatorSubscriptionAndCSV');
    alertExists('Error uninstalling Operator');
    cy.get(submitButton).contains('OK'); // test change from 'Uninstall'
    modal.cancel();
    modal.shouldBeClosed();
  });

  it(`attempts to uninstall the Operator and delete all Operand Instances, shows 'Error Deleting Operands' alert`, () => {
    // invalidate the request so operator doesn't get uninstalled
    cy.intercept('DELETE', '/api/kubernetes/apis/operators.coreos.com/', (req) => {
      req.url = `${req.url}-foobar`;
    }).as('deleteOperatorSubscriptionAndCSV');

    // invalidate the request so operand instance doesn't get deleted and error alert is shown
    cy.intercept('DELETE', testOperand.deleteURL, (req) => {
      req.url = `${req.url}-foobar`;
    }).as('deleteOperandInstance');

    cy.log('attempt uninstall the Operator and all Operand Instances');
    operator.uninstallModal.open(testOperator.name, testOperator.installedNamespace);
    operator.uninstallModal.checkDeleteAllOperands();
    modal.submit(true);
    cy.wait('@deleteOperatorSubscriptionAndCSV');
    cy.wait('@deleteOperandInstance');
    alertExists('Error uninstalling Operator');
    alertExists('Error deleting Operands');
    cy.get(submitButton).contains('OK'); // test change from 'Uninstall'
    modal.cancel();
    modal.shouldBeClosed();
  });

  // This is against Cypress best practices of test independence, but cy.intercepts are only cleared
  // before each test -they are not cleared before after[all]() hook, which is where this should exist
  // this might be addressed in Cypress v7.0
  it(`successfully uninstalls Operator and deletes all Operands`, () => {
    uninstallAndVerify();
  });
});
