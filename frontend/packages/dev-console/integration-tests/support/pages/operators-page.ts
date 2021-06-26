import { operators } from '../constants/global';
import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { modal } from '../../../../integration-tests-cypress/views/modal';
import { operatorsPO } from '../pageObjects/operators-po';
import { pageTitle } from '../constants/pageTitle';

export const operatorsPage = {
  navigateToOperatorHubPage: () => {
    cy.get(operatorsPO.nav.link)
      .contains('Operators')
      .click();
    cy.get(operatorsPO.nav.operatorHub).click({ force: true });
    detailsPage.titleShouldContain(pageTitle.OperatorHub);
  },

  navigateToInstallOperatorsPage: () => {
    cy.get(operatorsPO.nav.link)
      .contains('Operators')
      .click();
    cy.get(operatorsPO.nav.link)
      .contains('Installed Operators')
      .click();
  },

  searchOperator: (operatorName: string) => {
    cy.get(operatorsPO.operatorHub.search)
      .should('be.visible')
      .clear()
      .type(operatorName);
    cy.get(operatorsPO.operatorHub.numOfItems).should('be.visible');
  },

  installOperator: () => {
    cy.get(operatorsPO.installOperators.title).should('have.text', 'Install Operator');
    cy.byButtonText('Install').click();
    cy.get('article h1').should('be.visible');
  },

  verifySubscriptionPage: (operatorLogo: string) =>
    cy.get(operatorsPO.subscription.logo).should('have.text', operatorLogo),

  verifyInstalledOperator: (operatorName: string) => {
    cy.get(operatorsPO.installOperators.search, { timeout: 50000 })
      .clear()
      .type(operatorName);
    cy.get(operatorsPO.installOperators.operatorsNameRow, {
      timeout: 50000,
    }).should('be.visible');
  },

  verifyOperatorNotAvailable: (operatorName: string) => {
    cy.get(operatorsPO.installOperators.search)
      .clear()
      .type(operatorName);
    cy.get(operatorsPO.installOperators.noOperatorFoundMessage).should(
      'have.text',
      'No Operators Found',
    );
  },

  heading: (heading: string) => {
    return cy.get('h1').contains(heading);
  },

  selectOperator: (opt: operators | string) => {
    switch (opt) {
      case 'OpenShift Pipelines Operator':
      case operators.PipelineOperator: {
        cy.byTestID(
          'openshift-pipelines-operator-rh-redhat-operators-openshift-marketplace',
        ).click();
        break;
      }
      case 'OpenShift Serverless Operator':
      case operators.ServerlessOperator: {
        cy.byTestID('serverless-operator-redhat-operators-openshift-marketplace').click();
        break;
      }
      case 'OpenShift Virtualization':
      case operators.VirtualizationOperator: {
        cy.byTestID('kubevirt-hyperconverged-redhat-operators-openshift-marketplace').click();
        break;
      }
      case 'knative Apache Camel Operator':
      case operators.KnativeCamelOperator: {
        cy.byTestID('knative-camel-operator-community-operators-openshift-marketplace').click();
        modal.modalTitleShouldContain('Show Community Operator');
        cy.byTestID('confirm-action').click();
        break;
      }
      case 'Eclipse Che':
      case operators.EclipseCheOperator: {
        cy.byTestID('eclipse-che-community-operators-openshift-marketplace').click();
        modal.modalTitleShouldContain('Show Community Operator');
        cy.byTestID('confirm-action').click();
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  verifySidePane: () => cy.get(operatorsPO.alertDialog).should('be.exist'),

  clickInstallOnSidePane: () => {
    cy.get(operatorsPO.alertDialog).then(($sidePane) => {
      if ($sidePane.find(operatorsPO.sidePane.install).length) {
        cy.get(operatorsPO.sidePane.install).click({ force: true });
      } else {
        cy.log('Operator is already installed');
      }
    });
  },

  clickUninstallOnSidePane: () => {
    cy.get(operatorsPO.alertDialog).then(($sidePane) => {
      if ($sidePane.find(operatorsPO.sidePane.uninstall).length) {
        cy.get(operatorsPO.sidePane.uninstall).click();
      } else {
        cy.log('Operator is not installed');
      }
    });
  },

  verifyOperatorInNavigationMenu: (menuItem: string) => {
    cy.get(operatorsPO.nav.menuItems).should('have.length.greaterThan', 62);
    cy.get(operatorsPO.nav.menuItems)
      .contains(menuItem)
      .should('be.visible');
  },

  clickOnCreate: () => cy.byButtonText('Install').click(),
  clickOnCancel: () => cy.byButtonText('Cancel').click(),
};
