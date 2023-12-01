import { submitButton } from '@console/cypress-integration-tests/views/form';
import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { operator, TestOperandProps } from '../views/operator.view';

const testOperator = {
  name: 'Data Grid',
  operatorHubCardTestID: 'datagrid-redhat-operators-openshift-marketplace',
  installedNamespace: testName,
};

const testOperand: TestOperandProps = {
  name: 'Backup',
  group: 'infinispan.org',
  version: 'v1',
  kind: 'Backup',
  exampleName: 'example-backup',
};

const alertExists = (titleText: string) => {
  cy.get('.co-alert').contains(titleText).should('exist');
};

describe(`Testing uninstall of ${testOperator.name} Operator`, () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    operator.install(
      testOperator.name,
      testOperator.operatorHubCardTestID,
      testOperator.installedNamespace,
    );
    operator.installedSucceeded(testOperator.name, testName);
    operator.createOperand(testOperator.name, testOperand, testOperator.installedNamespace);
    cy.byTestID(testOperand.exampleName).should('exist');
    operator.operandShouldExist(testOperator.name, testOperand, testOperator.installedNamespace);
  });

  beforeEach(() => {
    operator.navToDetailsPage(testOperator.name, testOperator.installedNamespace);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`installs ${testOperator.name} Operator and ${testOperand.name} Instance, then navigates to Operator details page`, () => {
    cy.byTestSectionHeading('Provided APIs').should('exist');
    cy.byTestSectionHeading('ClusterServiceVersion details').should('exist');
    cy.byLegacyTestID('resource-summary').should('exist');
  });

  it(`attempts to uninstall the Operator, shows 'Cannot load Operands' alert`, () => {
    // return a static error response
    cy.intercept('GET', 'api/list-operands/?*', {
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

  it(`attempts to uninstall the Operator and delete all Operand Instances, shows 'Error Deleting Operands' alert`, () => {
    // invalidate the request so operand instance doesn't get deleted and error alert is shown
    cy.intercept(
      'DELETE',
      `/api/kubernetes/apis/infinispan.org/*/namespaces/${testName}/backups/*`,
      (req) => {
        req.destroy();
      },
    ).as('deleteOperandInstance');

    cy.log('attempt uninstall the Operator and all Operand Instances');
    operator.uninstallModal.open(testOperator.name, testOperator.installedNamespace);
    operator.uninstallModal.checkDeleteAllOperands();
    modal.submit(true);
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
    cy.log('uninstall the Operator and all Operand instances');
    operator.uninstall(testOperator.name, testOperator.installedNamespace, true);
    cy.log(`verify the Operator is not installed`);
    operator.shouldNotExist(testOperator.name, testOperator.installedNamespace);
    cy.log('verify operand instance is deleted or marked for deletion');
    cy.resourceShouldBeDeleted(testName, testOperand.kind, testOperand.exampleName);
  });
});
