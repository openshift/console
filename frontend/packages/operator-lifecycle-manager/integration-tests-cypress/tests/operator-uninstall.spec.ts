import { projectDropdown } from '@console/cypress-integration-tests/views/common';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { submitButton } from '@console/cypress-integration-tests/views/form';
import { listPage } from '@console/cypress-integration-tests/views/list-page';
import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { operator } from '../views/operator';

const testOperator = {
  name: 'Data Grid',
  operatorHubCardID: 'datagrid-redhat-operators-openshift-marketplace',
};

const testInstance = {
  name: 'Infinispan Cluster',
  kind: 'Infinispan',
  createDropDownID: 'infinispans.infinispan.org',
  createTitle: 'Create Infinispan',
  linkName: `example-infinispan-${testName}`,
  deleteUrl: '/api/kubernetes/apis/infinispan.org',
};

const alertExists = (titleText: string) => {
  cy.get('.pf-c-alert__title')
    .contains(titleText)
    .should('exist');
};

const createInstance = () => {
  listPage.titleShouldHaveText('Installed Operators');
  cy.byTestOperatorRow(testOperator.name).click(); // goto operator details page
  cy.log('navigate to the "All Instances" tab');
  cy.byLegacyTestID('horizontal-link-olm~All instances').click();
  cy.byTestID('msg-box-title').should('contain', 'No operands found');
  cy.byTestID('msg-box-detail').should(
    'contain',
    'Operands are declarative components used to define the behavior of the application.',
  );
  cy.log(`navigate to the ${testInstance.name} instance creation form`);
  cy.byLegacyTestID('dropdown-button')
    .click()
    .byTestDropDownMenu(testInstance.createDropDownID)
    .click();
  cy.byLegacyTestID('resource-title').should('contain', testInstance.createTitle);
  cy.log('create a new instance');
  cy.get('#root_metadata_name')
    .clear()
    .type(testInstance.linkName);
  cy.byTestID('create-dynamic-form').click();
  cy.byTestOperandLink(testInstance.linkName).should('contain', testInstance.linkName);
  cy.log(`navigate to the instance "Details" tab`);
  cy.byTestOperandLink(testInstance.linkName).click();
  cy.byTestSectionHeading(`${testInstance.name} overview`).should('exist');
};

const navToInstalledOperatorDetailsPage = () => {
  nav.sidenav.clickNavLink(['Operators', 'Installed Operators']);
  projectDropdown.selectProject(testName);
  projectDropdown.shouldContain(testName);
  listPage.filter.byName(testOperator.name);
  cy.byTestOperatorRow(testOperator.name, { timeout: 60000 }).should('exist');
  cy.byTestOperatorRow(testOperator.name).click();
};

const navToViewInstancesOfCRD = () => {
  nav.sidenav.clickNavLink(['Administration', 'CustomResourceDefinitions']);
  listPage.rows.shouldBeLoaded();
  listPage.filter.byName(testInstance.kind);
  listPage.rows.shouldExist(testInstance.kind);
  listPage.rows.clickKebabAction(testInstance.kind, 'View instances');
};

describe(`Testing ${testOperator.name} Operator`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
    operator.install(testOperator.name, testOperator.operatorHubCardID);
    createInstance();
  });

  beforeEach(() => {
    navToInstalledOperatorDetailsPage();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it(`installs ${testOperator.name} Operator and ${testInstance.name} Instance, then navigates to Operator details page`, () => {
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
    detailsPage.clickPageActionFromDropdown('Uninstall Operator');
    modal.shouldBeOpened();
    modal.modalTitleShouldContain('Uninstall Operator?');

    cy.wait('@listOperands');
    alertExists('Cannot load Operands');
    modal.cancel();
    modal.shouldBeClosed();
  });

  it(`attempts to uninstall the Operator, shows 'Error Uninstalling Operator' alert`, () => {
    // invalidate the request so operator doesn't get uninstalled, as opposed to
    // letting request go thru unchanged and mocking the response
    cy.intercept('DELETE', '/api/kubernetes/apis/operators.coreos.com/', (req) => {
      // examples:
      // .../api/kubernetes/apis/operators.coreos.com/v1alpha1/namespaces/test-mpnsw/subscriptions/datagrid-foobar
      // .../api/kubernetes/apis/operators.coreos.com/v1alpha1/namespaces/test-mpnsw/clusterserviceversions/datagrid-operator.v8.2.0-foobar
      req.url = `${req.url}-foobar`;
    }).as('deleteOperatorSubscriptionAndCSV');

    cy.log('attempt to uninstall the Operator');
    detailsPage.clickPageActionFromDropdown('Uninstall Operator');
    modal.shouldBeOpened();
    modal.modalTitleShouldContain('Uninstall Operator?');
    modal.submit(true);
    cy.wait('@deleteOperatorSubscriptionAndCSV');
    alertExists('Error Uninstalling Operator');
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
    cy.intercept('DELETE', testInstance.deleteUrl, (req) => {
      // example: .../api/kubernetes/apis/infinispan.org/v1/namespaces/test-dakvh/infinispans/example-infinispan-foobar
      req.url = `${req.url}-foobar`;
    }).as('deleteOperandInstance');

    cy.log('attempt uninstall the Operator and all Operand Instances');
    operator.uninstallModal.open();
    operator.uninstallModal.checkDeleteAllOperands();
    modal.submit(true);
    cy.wait('@deleteOperatorSubscriptionAndCSV');
    cy.wait('@deleteOperandInstance');
    alertExists('Error Uninstalling Operator');
    alertExists('Error Deleting Operands');
    cy.get(submitButton).contains('OK');
    modal.cancel();
    modal.shouldBeClosed();
  });

  it.only(`successfully uninstalls the Operator and Operand Instance`, () => {
    cy.log('verify operand instance exists');
    navToViewInstancesOfCRD();
    listPage.rows.shouldBeLoaded();
    listPage.rows.countShouldBe(1);

    cy.log('uninstall the Operator');
    navToInstalledOperatorDetailsPage();
    operator.uninstallModal.open();
    operator.uninstallModal.checkDeleteAllOperands();
    modal.submit(true);
    modal.shouldBeClosed();

    cy.log(`verify the Operator is not installed`);
    cy.get('.loading-skeleton--table').should('not.exist');
    listPage.titleShouldHaveText('Installed Operators');
    cy.byTestOperatorRow(testOperator.name).should('not.exist');
    cy.log('verify operand instance does NOT exist');
    navToViewInstancesOfCRD();
    listPage.rows.shouldNotExist(testInstance.linkName);
  });
});
