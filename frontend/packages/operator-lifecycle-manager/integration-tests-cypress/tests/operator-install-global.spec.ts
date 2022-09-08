import { checkErrors } from '../../../integration-tests-cypress/support';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { operator, GlobalInstalledNamespace, TestOperandProps } from '../views/operator.view';

const testOperator = {
  name: 'Service Binding Operator',
  operatorHubCardTestID: 'rh-service-binding-operator-redhat-operators-openshift-marketplace',
};

const testOperand: TestOperandProps = {
  name: 'ServiceBinding',
  group: 'binding.operators.coreos.com',
  version: 'v1alpha1',
  kind: 'ServiceBinding',
  createActionID: 'list-page-create-dropdown-item-servicebindings.binding.operators.coreos.com',
  exampleName: 'example-servicebinding',
};

describe(`Globally installing "${testOperator.name}" operator in ${GlobalInstalledNamespace}`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    operator.install(testOperator.name, testOperator.operatorHubCardTestID);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    operator.uninstall(testOperator.name);
    operator.shouldNotExist(testOperator.name);
    cy.logout();
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
  });
});
