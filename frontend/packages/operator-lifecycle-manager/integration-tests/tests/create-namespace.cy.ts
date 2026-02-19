import { checkErrors, testName } from '@console/cypress-integration-tests/support';
import { modal } from '@console/cypress-integration-tests/views/modal';

describe('Create namespace from install operators', () => {
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

  const nsName = `${testName}-ns`;

  it('creates namespace from operator install page', () => {
    const operatorSelector = 'operator-Red Hat Integration - 3scale';
    const operatorName = 'Red Hat Integration - 3scale';
    cy.log('test namespace creation from dropdown');
    cy.visit(`/catalog/ns/${testName}`);
    cy.byTestID('tab operator').click();
    cy.byTestID('search-catalog').type(operatorName);
    cy.url().should('include', 'keyword');
    cy.byTestID(operatorSelector).click();
    cy.byTestID('catalog-details-modal-cta').click({ force: true });

    // 3scale 2.11 supports only installation mode 'A specific namespace',
    // so it was automatically selected.
    // But starting with 2.12 it also supports 'All namespaces'.
    // So it is required to select this radio option to specify the namespace.
    cy.byTestID('A specific namespace on the cluster-radio-input').click();

    // configure operator install ("^=Create_"" will match "Create_Namespace" and "Create_Project")
    cy.byTestID('dropdown-selectbox').click().get('[data-test-dropdown-menu^="Create_"]').click();

    // verify namespace modal is opened
    modal.shouldBeOpened();
    cy.byTestID('input-name').type(nsName);
    modal.submit();
    modal.shouldBeClosed();

    // verify the dropdown selection shows the newly created namespace
    cy.byTestID('dropdown-selectbox').should('contain', `${nsName}`);

    cy.get('button').contains('Install').click();

    // verify operator began installation
    cy.byTestID('view-installed-operators-btn').should(
      'contain',
      `View installed Operators in Namespace ${nsName}`,
    );

    // Verify namespace was created successfully
    cy.deleteProject(nsName);
  });
});
