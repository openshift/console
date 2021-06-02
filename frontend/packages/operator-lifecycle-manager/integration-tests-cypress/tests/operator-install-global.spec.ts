import { checkErrors } from '../../../integration-tests-cypress/support';
import { detailsPage } from '../../../integration-tests-cypress/views/details-page';
import { modal } from '../../../integration-tests-cypress/views/modal';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { createCatalogSource, deleteCatalogSource } from '../views/catalog-source.view';

const operatorName = 'Portworx Essentials';
const catalogSourceName = 'console-e2e';
const operatorID = 'portworx-essentials-console-e2e-openshift-marketplace';
const operatorRow = 'Portworx Essentials';
const operatorPkgName = 'portworx-essentials';
const operatorInstallFormURL = `/operatorhub/subscribe?pkg=${operatorPkgName}&catalog=${catalogSourceName}&catalogNamespace=openshift-marketplace&targetNamespace=`;
const operatorInstance = 'StorageCluster';
const openshiftOperatorsNS = 'openshift-operators';
const operandLink = 'portworx';

// TODO: Disable until https://github.com/libopenstorage/operator/pull/323 is merged
xdescribe(`Interacting with a global install mode Operator (${operatorName})`, () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    createCatalogSource(operatorName, catalogSourceName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.log('navigate to OperatorHub > Sources');
    deleteCatalogSource(catalogSourceName);
    cy.logout();
  });

  it(`displays subscription creation form for ${operatorName}`, () => {
    cy.log('navigate to the Operator install form from OperatorHub');
    cy.visit('/operatorhub/all-namespaces');
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.byTestID(operatorID).click();
    cy.log('go to the install form');
    cy.byLegacyTestID('operator-install-btn').click({ force: true });
    cy.url().should('include', operatorInstallFormURL);
  });

  it(`creates the global install mode ClusterServiceVersion for ${operatorName}`, () => {
    cy.visit(operatorInstallFormURL);
    cy.byTestID('install-operator').click();
    cy.log('verify Operator began installation');
    cy.byTestID('view-installed-operators-btn').should(
      'contain',
      `View installed Operators in Namespace ${openshiftOperatorsNS}`,
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
    cy.log('navigate to the "All instances" tab');
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
      .get('[data-test-dropdown-menu="storageclusters.core.libopenstorage.org"]')
      .click();
    cy.byLegacyTestID('resource-title').should('contain', `Create ${operatorInstance}`);
  });

  it(`creates a ${operatorName} ${operatorInstance} instance via the form`, () => {
    cy.log('create a new instance');
    cy.byTestID('create-dynamic-form').click();
    cy.byTestOperandLink(operandLink).should('contain', 'portworx');
  });

  it(`displays details about ${operatorName} ${operatorInstance} instance on the "Details" tab`, () => {
    cy.log(`navigate to the "Details" tab`);
    cy.byTestOperandLink(operandLink).click();
    cy.byTestSectionHeading('Storage Cluster overview').should('exist');
  });

  it(`deletes the ${operatorName} ${operatorInstance} instance`, () => {
    detailsPage.clickPageActionFromDropdown(`Delete ${operatorInstance}`);
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.byTestID('msg-box-title').should('contain', 'No operands found');
    cy.byTestID('msg-box-detail').should(
      'contain',
      'Operands are declarative components used to define the behavior of the application.',
    );
  });

  it(`uninstalls the Operator`, () => {
    cy.log('navigate to the Operator uninstall modal in OperatorHub');
    cy.visit('/operatorhub/all-namespaces');
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.byTestID(operatorID).click();
    cy.log('uninstall the operator');
    cy.byLegacyTestID('operator-uninstall-btn').click({ force: true });
    cy.url().should(
      'include',
      `/k8s/ns/${openshiftOperatorsNS}/subscriptions/${operatorPkgName}?showDelete=true`,
    );
    modal.shouldBeOpened();
    modal.modalTitleShouldContain('Uninstall Operator?');
    modal.submit(true);
    modal.shouldBeClosed();
    cy.log('verify the Operator is not installed');
    cy.get('.loading-skeleton--table').should('not.exist');
    cy.byTestOperatorRow(operatorRow).should('not.exist');
  });
});
