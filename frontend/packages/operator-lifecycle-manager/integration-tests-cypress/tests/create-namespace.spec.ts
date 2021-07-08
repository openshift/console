import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { nav } from '../../../integration-tests-cypress/views/nav';

describe('Create namespace from install operators', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  const nsName = `${testName}-ns`;

  it('creates namespace from operator install page', () => {
    const operatorSelector = 'advanced-cluster-management-redhat-operators-openshift-marketplace';
    cy.log('test namespace creation from dropdown');
    cy.visit(`/operatorhub/ns/${testName}`);
    cy.byTestID(operatorSelector).click();
    cy.byLegacyTestID('operator-install-btn').click({ force: true });

    // configure operator install
    cy.byTestID('Select a Namespace-radio-input').check();
    cy.byTestID('dropdown-selectbox')
      .click()
      .get('[data-test-dropdown-menu="Create_Namespace"]')
      .click();

    // verify namespace modal is opened
    modal.shouldBeOpened();
    cy.byTestID('input-name').type(nsName);
    modal.submit();
    modal.shouldBeClosed();

    // verify the dropdown selection shows the newly created namespace
    cy.byTestID('dropdown-selectbox').should('contain', `${nsName}`);

    cy.get('button')
      .contains('Install')
      .click();

    // verify operator began installation
    cy.byTestID('view-installed-operators-btn').should(
      'contain',
      `View installed Operators in Namespace ${nsName}`,
    );

    // Verify namespace was created successfully
    cy.deleteProject(nsName);
  });
});
