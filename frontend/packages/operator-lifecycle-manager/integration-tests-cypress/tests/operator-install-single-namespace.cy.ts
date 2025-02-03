import { projectDropdown } from '@console/cypress-integration-tests/views/common';
import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { GlobalInstalledNamespace, operator, TestOperandProps } from '../views/operator.view';

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

describe(`Installing "${testOperator.name}" operator in test namespace`, () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it(`Installs ${testOperator.name} operator in test namespace and creates ${testOperand.name} operand instance`, () => {
    operator.install(
      testOperator.name,
      testOperator.operatorHubCardTestID,
      testOperator.installedNamespace,
    );
    operator.installedSucceeded(testOperator.name, testName);

    operator.navToDetailsPage(testOperator.name, testOperator.installedNamespace);
    cy.byTestSectionHeading('Provided APIs').should('exist');
    cy.byTestSectionHeading('ClusterServiceVersion details').should('exist');
    cy.byLegacyTestID('resource-summary').should('exist');

    // should not be installed Globally
    cy.log(
      `Operator "${testOperator.name}" should not be installed in "${GlobalInstalledNamespace}"`,
    );
    nav.sidenav.clickNavLink(['Operators', 'Installed Operators']);
    projectDropdown.selectProject(GlobalInstalledNamespace);
    projectDropdown.shouldContain(GlobalInstalledNamespace);
    cy.get('.loading-skeleton--table').should('not.exist');
    cy.byTestID('console-empty-state').should('contain', 'No Operators found');

    operator.createOperand(testOperator.name, testOperand, testOperator.installedNamespace);
    cy.byTestID(testOperand.exampleName).should('exist');
    operator.operandShouldExist(testOperator.name, testOperand, testOperator.installedNamespace);

    operator.deleteOperand(testOperator.name, testOperand, testOperator.installedNamespace);
    operator.operandShouldNotExist(testOperator.name, testOperand, testOperator.installedNamespace);

    operator.uninstall(testOperator.name, testOperator.installedNamespace);
    operator.shouldNotExist(testOperator.name, testOperator.installedNamespace);
  });
});
