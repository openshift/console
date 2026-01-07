import { projectDropdown } from '@console/cypress-integration-tests/views/common';
import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { nav } from '../../../integration-tests-cypress/views/nav';
import type { TestOperandProps } from '../views/operator.view';
import { GlobalInstalledNamespace, operator } from '../views/operator.view';

const testOperator = {
  name: 'Data Grid',
  operatorCardTestID: 'operator-Data Grid',
  installedNamespace: testName,
};

const testOperand: TestOperandProps = {
  name: 'Backup',
  group: 'infinispan.org',
  version: 'v1',
  kind: 'Backup',
  exampleName: 'example-backup',
};

const operatorPackageName = 'datagrid';

const cleanupOperatorResources = (namespace: string) => {
  cy.exec(
    `oc delete subscription -l operators.coreos.com/${operatorPackageName}.${namespace} -n ${namespace} --ignore-not-found`,
    { failOnNonZeroExit: false, timeout: 120000 },
  );
  cy.exec(
    `oc delete csv -l operators.coreos.com/${operatorPackageName}.${namespace} -n ${namespace} --ignore-not-found`,
    { failOnNonZeroExit: false, timeout: 120000 },
  );
  cy.exec(
    `oc delete installplan -l operators.coreos.com/${operatorPackageName}.${namespace} -n ${namespace} --ignore-not-found`,
    { failOnNonZeroExit: false, timeout: 120000 },
  );
};

describe(`Installing "${testOperator.name}" operator in test namespace`, () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
    cleanupOperatorResources(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cleanupOperatorResources(testName);
    cy.deleteProjectWithCLI(testName);
  });

  it(`Installs ${testOperator.name} operator in test namespace and creates ${testOperand.name} operand instance`, () => {
    operator.install(
      testOperator.name,
      testOperator.operatorCardTestID,
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
    nav.sidenav.clickNavLink(['Ecosystem', 'Installed Operators']);
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
