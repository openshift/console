import { checkErrors } from '../../../integration-tests-cypress/support';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { operator, GlobalInstalledNamespace, TestOperandProps } from '../views/operator.view';

// TODO find light-weight RH global operator!
const testOperator = {
  name: '',
  operatorHubCardTestID: '',
};

const testOperand: TestOperandProps = {
  name: '',
  kind: '',
  tabName: '',
  exampleName: ``,
};

xdescribe(`Globally installing "${testOperator.name}" operator in ${GlobalInstalledNamespace}`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
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
    operator.install(testOperator.name, testOperator.operatorHubCardTestID);
    operator.installedSucceeded(testOperator.name);

    operator.navToDetailsPage(testOperator.name);
    cy.byTestSectionHeading('Provided APIs').should('exist');
    cy.byTestSectionHeading('ClusterServiceVersion details').should('exist');
    cy.byLegacyTestID('resource-summary').should('exist');

    operator.createOperand(testOperator.name, testOperand);
    operator.operandShouldExist(testOperator.name, testOperand);

    operator.deleteOperand(testOperator.name, testOperand);
    operator.operandShouldNotExist(testOperator.name, testOperand);
  });
});
