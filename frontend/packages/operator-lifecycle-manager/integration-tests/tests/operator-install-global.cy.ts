import { checkErrors } from '@console/cypress-integration-tests/support';
import type { TestOperandProps } from '../views/operator.view';
import { operator, GlobalInstalledNamespace } from '../views/operator.view';

const testOperator = {
  name: 'Data Grid',
  operatorCardTestID: 'operator-Data Grid',
};

const testOperand: TestOperandProps = {
  name: 'Infinispan',
  group: 'infinispan.org',
  version: 'v1',
  kind: 'Infinispan',
  createActionID: 'list-page-create-dropdown-item-infinispan.org~v1~Infinispan',
  exampleName: 'example-infinispan',
};

const operatorPackageName = 'datagrid';

const cleanupOperatorResources = () => {
  cy.exec(
    `oc delete subscription -l operators.coreos.com/${operatorPackageName}.${GlobalInstalledNamespace} -n ${GlobalInstalledNamespace} --ignore-not-found`,
    { failOnNonZeroExit: false, timeout: 120000 },
  );
  cy.exec(
    `oc delete csv -l operators.coreos.com/${operatorPackageName}.${GlobalInstalledNamespace} -n ${GlobalInstalledNamespace} --ignore-not-found`,
    { failOnNonZeroExit: false, timeout: 120000 },
  );
  cy.exec(
    `oc delete installplan -l operators.coreos.com/${operatorPackageName}.${GlobalInstalledNamespace} -n ${GlobalInstalledNamespace} --ignore-not-found`,
    { failOnNonZeroExit: false, timeout: 120000 },
  );
};

xdescribe(`Globally installing "${testOperator.name}" operator in ${GlobalInstalledNamespace}`, () => {
  before(() => {
    cy.login();
    cleanupOperatorResources();
    operator.install(testOperator.name, testOperator.operatorCardTestID);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cleanupOperatorResources();
  });

  it(`Globally installs ${testOperator.name} operator in ${GlobalInstalledNamespace} and creates ${testOperand.name} operand`, () => {
    operator.installedSucceeded(testOperator.name);
    operator.navToDetailsPage(testOperator.name);
    cy.byTestSectionHeading('Provided APIs').should('exist');
    cy.byTestSectionHeading('ClusterServiceVersion details').should('exist');
    cy.byLegacyTestID('resource-summary').should('exist');

    operator.createOperand(testOperator.name, testOperand);
    cy.byTestID(testOperand.exampleName).should('exist');
    operator.operandShouldExist(testOperator.name, testOperand);

    operator.deleteOperand(testOperator.name, testOperand);
    operator.operandShouldNotExist(testOperator.name, testOperand);

    operator.uninstall(testOperator.name);
    operator.shouldNotExist(testOperator.name);
  });
});
