import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { createCatalogSource, deleteCatalogSource } from '../views/catalog-source.view';

const operatorName = 'Couchbase Operator';
const catalogSourceName = 'console-e2e';
const operatorID = 'couchbase-enterprise-console-e2e-openshift-marketplace';
const operatorRow = 'Couchbase Operator';
const operatorPkgName = 'couchbase-enterprise';
const operatorInstallFormURL = `/operatorhub/subscribe?pkg=${operatorPkgName}&catalog=${catalogSourceName}&catalogNamespace=openshift-marketplace&targetNamespace=${testName}`;
const operatorInstance = 'CouchbaseCluster';
const operandLink = 'cb-example';

xdescribe(`Interacting with a single namespace install mode Operator (${operatorName})`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
    createCatalogSource(operatorName, catalogSourceName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    deleteCatalogSource(catalogSourceName);
    cy.logout();
  });

  it(`displays subscription creation form for ${operatorName}`, () => {
    cy.log('navigate to the Operator install form from OperatorHub');
    cy.visit(`/operatorhub/ns/${testName}`);
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.byTestID(operatorID).click();
    cy.log('go to the install form');
    cy.byLegacyTestID('operator-install-btn').click({ force: true });
    cy.url().should('include', operatorInstallFormURL);
  });

  it(`creates the single namespace install mode ClusterServiceVersion for ${operatorName}`, () => {
    cy.visit(operatorInstallFormURL);
    cy.log('configure Operator install form for single namespace');
    cy.byTestID('A specific namespace on the cluster-radio-input').check();
    cy.log(`verify the dropdown selection shows the ${testName} namespace`);
    cy.byTestID('dropdown-selectbox').should('contain', `${testName}`);
    cy.byTestID('install-operator').click();
    cy.log('verify Operator began installation');
    cy.byTestID('view-installed-operators-btn').should(
      'contain',
      `View installed Operators in Namespace ${testName}`,
    );
    cy.log('view the ClusterServiceVersion list page');
    cy.byTestID('view-installed-operators-btn').click();
    cy.log(`verify the ClusterServiceVersion row for ${operatorRow} exists`);
    cy.byTestOperatorRow(operatorRow, { timeout: 60000 }).should('exist');
  });

  it(`displays details about ${operatorName} ClusterServiceVersion on the "Details" tab`, () => {
    cy.log(`navigate to the ${operatorName} details page`);
    cy.byTestOperatorRow(operatorRow).click();
    cy.byTestSectionHeading('Provided APIs').should('exist');
    cy.byTestSectionHeading('ClusterServiceVersion details').should('exist');
    cy.byLegacyTestID('resource-summary').should('exist');
  });

  it(`displays empty message on the ${operatorName} ClusterServiceVersion "All Instances" tab`, () => {
    cy.log('navigate to the "All Instances" tab');
    cy.byLegacyTestID('horizontal-link-olm~All instances').click();
    cy.byTestID('msg-box-title').should('contain', 'No operands found');
    cy.byTestID('msg-box-detail').should(
      'contain',
      'Operands are declarative components used to define the behavior of the application.',
    );
  });

  it(`displays ${operatorName} ${operatorInstance} creation form`, () => {
    cy.log('navigate to the form');
    cy.byLegacyTestID('dropdown-button')
      .click()
      .get('[data-test-dropdown-menu="couchbaseclusters.couchbase.com"]')
      .click();
    cy.byLegacyTestID('resource-title').should('contain', `Create ${operatorInstance}`);
  });

  it(`creates a ${operatorName} ${operatorInstance} instance via the form`, () => {
    cy.log('create a new instance');
    cy.byTestID('create-dynamic-form').click();
    cy.byTestOperandLink(operandLink).should('contain', operandLink);
  });

  it(`displays details about ${operatorName} ${operatorInstance} instance on the "Details" tab`, () => {
    cy.log(`navigate to the "Details" tab`);
    cy.byTestOperandLink(operandLink).click();
    cy.byTestSectionHeading('Couchbase Cluster overview').should('exist');
  });

  it(`uninstalls the Operator from ${testName} namespace`, () => {
    cy.log('navigate to the Operator uninstall modal in OperatorHub');
    cy.visit(`/operatorhub/ns/${testName}`);
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.byTestID(operatorID).click();
    cy.log('uninstall the Operator');
    cy.byLegacyTestID('operator-uninstall-btn').click({ force: true });
    cy.url().should(
      'include',
      `/k8s/ns/${testName}/subscriptions/${operatorPkgName}?showDelete=true`,
    );
    modal.shouldBeOpened();
    modal.modalTitleShouldContain('Uninstall Operator?');
    modal.submit(true);
    modal.shouldBeClosed();
    cy.url().should(
      'include',
      `/k8s/ns/${testName}/operators.coreos.com~v1alpha1~ClusterServiceVersion`,
    );
    cy.log(`verify the Operator is not installed in namespace ${testName}`);
    cy.get('.loading-skeleton--table').should('not.exist');
    cy.byTestOperatorRow(operatorRow).should('not.exist');
  });
});
