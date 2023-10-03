import { checkErrors } from '../../../integration-tests-cypress/support';
import { operator, GlobalInstalledNamespace, TestOperandProps } from '../views/operator.view';

const testOperator = {
  name: 'Data Grid',
  operatorHubCardTestID: 'datagrid-redhat-operators-openshift-marketplace',
};

const testOperand: TestOperandProps = {
  name: 'Infinispan',
  group: 'infinispan.org',
  version: 'v1',
  kind: 'Infinispan',
  createActionID: 'list-page-create-dropdown-item-infinispan.org~v1~Infinispan',
  exampleName: 'example-infinispan',
};

describe(`Globally installing "${testOperator.name}" operator in ${GlobalInstalledNamespace}`, () => {
  before(() => {
    cy.login();
    operator.install(testOperator.name, testOperator.operatorHubCardTestID);
  });

  afterEach(() => {
    checkErrors();
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
