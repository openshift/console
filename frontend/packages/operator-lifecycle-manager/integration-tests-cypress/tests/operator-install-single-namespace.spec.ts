import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { modal } from '../../../integration-tests-cypress/views/modal';

const operatorName = '3scale Operator';

describe(`Interacting with a single namespace install mode Operator (${operatorName})`, () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  const operatorPkgName = '3scale-community-operator';
  const operatorID = '3scale-community-operator-community-operators-openshift-marketplace';
  const operatorRow = '3scale API Management';
  const operatorInstallFormURL = `/operatorhub/subscribe?pkg=${operatorPkgName}&catalog=community-operators&catalogNamespace=openshift-marketplace&targetNamespace=${testName}`;
  const operatorInstance = 'APIManagerBackup';
  const operandLink = 'example-apimanagerbackup';

  it(`displays subscription creation form for ${operatorName}`, () => {
    cy.log('navigate to the operator install form from OperatorHub');
    cy.visit(`/operatorhub/ns/${testName}`);
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.byTestID(operatorID).click();
    cy.log('dismiss Show Community Operator modal');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.log('go to the install form');
    cy.byLegacyTestID('operator-install-btn').click({ force: true });
    cy.url().should('include', operatorInstallFormURL);
  });

  it(`creates the single namespace install mode ClusterServiceVersion for ${operatorName}`, () => {
    cy.visit(operatorInstallFormURL);
    cy.log('configure operator install form for single namespace');
    cy.byTestID('A specific namespace on the cluster-radio-input').check();
    cy.log(`verify the dropdown selection shows the ${testName} namespace`);
    cy.byTestID('dropdown-selectbox').should('contain', `${testName}`);
    cy.byTestID('install-operator').click();
    cy.log('verify operator began installation');
    cy.byTestID('view-installed-operators-btn').should(
      'contain',
      `View Installed Operators in namespace ${testName}`,
    );
    cy.log('view the ClusterServiceVersion list page');
    cy.byTestID('view-installed-operators-btn').click();
    cy.log(`verify the ClusterServiceVersion row for ${operatorRow} exists`);
    cy.byTestOperatorRow(operatorRow).should('exist');
  });

  it(`displays details about ${operatorName} ClusterServiceVersion on the "Details" tab`, () => {
    cy.log(`navigate to the ${operatorName} details page`);
    cy.byTestOperatorRow(operatorRow).click();
    cy.byTestSectionHeading('Provided APIs').should('exist');
    cy.byTestSectionHeading('ClusterServiceVersion Details').should('exist');
    cy.byLegacyTestID('resource-summary').should('exist');
  });

  it(`displays empty message on the ${operatorName} ClusterServiceVersion "All Instances" tab`, () => {
    cy.log('navigate to the "All Instances" tab');
    cy.byLegacyTestID('horizontal-link-All Instances').click();
    cy.byTestID('msg-box-title').should('contain', 'No Operands Found');
    cy.byTestID('msg-box-detail').should(
      'contain',
      'Operands are declarative components used to define the behavior of the application.',
    );
  });

  it(`displays ${operatorName} ${operatorInstance} creation form`, () => {
    cy.log('navigate to the form');
    cy.byLegacyTestID('dropdown-button')
      .click()
      .get('[data-test-dropdown-menu="apimanagerbackups.apps.3scale.net"]')
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
    cy.byTestSectionHeading('APIManagerBackup Overview').should('exist');
  });

  it(`uninstalls the operator from ${testName} namespace`, () => {
    cy.log('navigate to the operator uninstall modal in OperatorHub');
    cy.visit(`/operatorhub/ns/${testName}`);
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.byTestID(operatorID).click();
    cy.log('dismiss Show Community Operator modal');
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
    cy.log('uninstall the operator');
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
    cy.log(`verify the operator is not installed in namespace ${testName}`);
    cy.get('.loading-skeleton--table').should('not.be.visible');
    cy.byTestOperatorRow(operatorRow).should('not.exist');
  });
});
