import { projectDropdown } from '@console/cypress-integration-tests/views/common';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { submitButton } from '@console/cypress-integration-tests/views/form';
import { listPage } from '@console/cypress-integration-tests/views/list-page';
import { modal } from '@console/cypress-integration-tests/views/modal';
import { nav } from '@console/cypress-integration-tests/views/nav';

export const GlobalInstalledNamespace = 'openshift-operators';

export const operator = {
  install: (
    operatorName: string,
    operatorHubCardTestID: string,
    installToNamespace: string = GlobalInstalledNamespace,
    useOperatorRecommendedNamespace: boolean = false,
  ) => {
    cy.log(`install operator "${operatorName}" in ${installToNamespace}`);
    nav.sidenav.clickNavLink(['Operators', 'OperatorHub']);
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.log('go to operator overview panel');
    cy.byTestID(operatorHubCardTestID).click();
    cy.log('go to the install form');
    cy.byLegacyTestID('operator-install-btn').click({ force: true });
    /*  Installation mode
     *    () All namespaces        // default: 'openshift-operators'
     *    () A specific namespace  // Operator recommended or test namespace
     *  Installed Namespace
     *    () Operator recommended Namespace
     *      [] Enable Operator recommended monitoring - // TODO add testing support for this
     *    () Select a Namespace
     *      [Select Namespace v] // dropdown defaults to global ns ('openshift-operators') or test namespace (when 'Select a Namespace radio' is checked!)
     *                           // dropdown not shown at all when 'Operator recommended Namespace radio' is checked!
     */
    if (installToNamespace !== GlobalInstalledNamespace) {
      cy.log('configure Operator install for single namespace');
      cy.byTestID('A specific namespace on the cluster-radio-input').check();
      if (useOperatorRecommendedNamespace) {
        cy.log('configure Operator install for operator recommended namespace');
        cy.byTestID('Operator recommended Namespace:-radio-input').check();
      } else {
        // eslint-disable-next-line promise/catch-or-return
        cy.get('body').then(($body) => {
          if ($body.find('input[data-test="Select a Namespace-radio-input"]').length > 0) {
            cy.byTestID('Select a Namespace-radio-input').check();
          }
        });
      }
    } else {
      cy.byTestID('All namespaces on the cluster-radio-input').should('be.checked');
    }
    if (!useOperatorRecommendedNamespace) {
      cy.log(`verify namespace dropdown shows the "${installToNamespace}" namespace`);
      cy.byTestID('dropdown-selectbox').should('contain', installToNamespace);
    }
    // Install
    cy.byTestID('install-operator').click();
    cy.log('verify Operator began installation');
    cy.byTestID('view-installed-operators-btn').should(
      'contain',
      `View installed Operators in Namespace`,
    );
    cy.log(`navigate to OperatorHub in Namespace: ${installToNamespace}`);
    cy.byTestID('view-installed-operators-btn').click();
  },
  installedSucceeded: (
    operatorName: string,
    installToNamespace: string = GlobalInstalledNamespace,
  ) => {
    cy.log(`operator "${operatorName}" should exist in ${installToNamespace}`);
    nav.sidenav.clickNavLink(['Operators', 'Installed Operators']);
    listPage.titleShouldHaveText('Installed Operators');
    listPage.filter.byName(operatorName);
    cy.byTestOperatorRow(operatorName, { timeout: 180000 }).should('exist'); // 3 minutes
    listPage.rows.countShouldBe(1);
    cy.byTestID('status-text', { timeout: 720000 }).should('contain.text', 'Succeeded'); // 12 minutes
  },
  navToDetailsPage: (
    operatorName: string,
    installedNamespace: string = GlobalInstalledNamespace,
  ) => {
    cy.log(`navigate to details page of operator "${operatorName}"`);
    nav.sidenav.clickNavLink(['Operators', 'Installed Operators']);
    listPage.titleShouldHaveText('Installed Operators');
    projectDropdown.selectProject(installedNamespace);
    projectDropdown.shouldContain(installedNamespace);
    listPage.filter.byName(operatorName);
    listPage.rows.countShouldBe(1);
    cy.byTestOperatorRow(operatorName).should('exist');
    cy.byTestOperatorRow(operatorName).click();
  },
  horizontalNavTab: (tabID) => cy.byLegacyTestID(`horizontal-link-${tabID}`).last(),
  uninstallModal: {
    open: (operatorName: string, installedNamespace: string = GlobalInstalledNamespace) => {
      cy.log('open uninstall modal');
      operator.navToDetailsPage(operatorName, installedNamespace);
      detailsPage.clickPageActionFromDropdown('Uninstall Operator');
      modal.shouldBeOpened();
      modal.modalTitleShouldContain('Uninstall Operator?');
      cy.get('.loading-skeleton--table').should('not.exist');
    },
    checkDeleteAllOperands: () =>
      cy.byTestID('Delete all operand instances for this operator__checkbox').click(),
  },
  createOperand: (
    operatorName: string,
    testOperand: TestOperandProps,
    installedNamespace: string = GlobalInstalledNamespace,
  ) => {
    const { exampleName, createActionID } = testOperand;
    cy.log(`create operand "${exampleName}" for "${operatorName}" in ${installedNamespace}`);
    operator.navToDetailsPage(operatorName, installedNamespace);
    operator.horizontalNavTab('olm~All instances').click();
    cy.byTestOperandLink(exampleName).should('not.exist');
    cy.byTestID('item-create').click();
    cy.byTestID(createActionID).click();
    cy.url().should('contain', '~new');
    cy.log('create a new operand');
    cy.get('[id="root_metadata_name"]')
      .should('not.be.disabled')
      .clear();
    cy.get('[id="root_metadata_name"]').type(exampleName);
    cy.get(submitButton).click();
  },
  operandShouldExist: (
    operatorName: string,
    testOperand: TestOperandProps,
    installedNamespace: string = GlobalInstalledNamespace,
  ) => {
    const { exampleName } = testOperand;
    cy.log(`operand "${exampleName}" should exist for "${operatorName}" in ${installedNamespace}`);
    operator.navToDetailsPage(operatorName, installedNamespace);
    operator.horizontalNavTab('olm~All instances').click();
    cy.byTestID(exampleName).should('exist');
    cy.log(`navigate to the operand "Details" tab`);
    cy.byTestID(exampleName).click();
    cy.url().should('match', new RegExp(`${exampleName}$`)); // url should end with example operand name
  },
  deleteOperand: (
    operatorName: string,
    testOperand: TestOperandProps,
    installedNamespace: string = GlobalInstalledNamespace,
  ) => {
    const { kind, exampleName } = testOperand;
    cy.log(`delete operand: ${exampleName}`);
    operator.navToDetailsPage(operatorName, installedNamespace);
    operator.horizontalNavTab('olm~All instances').click();
    // drilldown to Operand details page
    cy.byTestOperandLink(exampleName).click();

    // FIXME these selectors may be unreliable due to dynamic plugins
    detailsPage.clickPageActionFromDropdown(`Delete ${kind}`);
    modal.shouldBeOpened();
    modal.submit();
    modal.shouldBeClosed();
  },
  operandShouldNotExist: (
    operatorName: string,
    testOperand: TestOperandProps,
    installedNamespace: string = GlobalInstalledNamespace,
  ) => {
    const { exampleName } = testOperand;
    cy.log(`operand "${exampleName}" should not exist`);
    operator.navToDetailsPage(operatorName, installedNamespace);
    operator.horizontalNavTab('olm~All instances').click();
    cy.byTestID(exampleName).should('not.exist');
  },
  uninstall: (
    operatorName: string,
    installedNamespace: string = GlobalInstalledNamespace,
    deleteAllOperands: boolean = false,
  ) => {
    cy.log(`uninstall operator "${operatorName}" in ${installedNamespace}`);
    operator.navToDetailsPage(operatorName, installedNamespace);
    operator.uninstallModal.open(operatorName, installedNamespace);
    if (deleteAllOperands) {
      operator.uninstallModal.checkDeleteAllOperands();
    }
    modal.submit(true);
    modal.shouldBeClosed();
  },
  shouldNotExist: (operatorName: string, installToNamespace: string = GlobalInstalledNamespace) => {
    cy.log(`operator "${operatorName}" should not exist in ${installToNamespace}`);
    nav.sidenav.clickNavLink(['Operators', 'Installed Operators']);
    cy.byTestOperatorRow(operatorName).should('not.exist');
  },
};

export type TestOperandProps = {
  name: string;
  group: string;
  version: string;
  kind: string;
  createActionID: string;
  exampleName: string;
  deleteURL?: string;
};
