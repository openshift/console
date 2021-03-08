import { operators } from '../constants/global';
import { detailsPage } from '../../../../integration-tests-cypress/views/details-page';
import { operatorsPO } from '../pageObjects/operators-po';
import { pageTitle } from '../constants/pageTitle';

export const operatorsPage = {
  navigateToOperatorHubPage: () => {
    cy.get(operatorsPO.nav.operators).click();
    cy.get(operatorsPO.nav.operatorHub).click({ force: true });
    detailsPage.titleShouldContain(pageTitle.OperatorHub);
  },

  navigateToInstallOperatorsPage: () => {
    cy.get(operatorsPO.nav.operators).click();
    cy.get(operatorsPO.nav.installedOperators).click({ force: true });
    detailsPage.titleShouldContain(pageTitle.InstalledOperators);
  },

  searchOperator: (operatorName: string | operators) => {
    cy.get(operatorsPO.search)
      .should('be.visible')
      .clear()
      .type(operatorName);
  },

  verifySubscriptionPage: (operatorLogo: string) =>
    cy.get(operatorsPO.subscription.logo).should('have.text', operatorLogo),

  verifyInstalledOperator: (operatorName: string) => {
    cy.get(operatorsPO.installOperators.search)
      .should('be.visible')
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

  selectOperator: (opt: operators | string) => {
    switch (opt) {
      case 'OpenShift Pipelines Operator':
      case operators.PipelinesOperator: {
        cy.get(operatorsPO.operatorHub.pipelinesOperatorCard).click();
        break;
      }
      case 'OpenShift Serverless Operator':
      case operators.ServerlessOperator: {
        cy.get(operatorsPO.operatorHub.serverlessOperatorCard).click();
        break;
      }
      case 'OpenShift Virtualization':
      case operators.VirtualizationOperator: {
        cy.get(operatorsPO.operatorHub.virtualizationOperatorCard).click();
        break;
      }
      case 'knative Apache Camel Operator':
      case operators.KnativeCamelOperator: {
        cy.get(operatorsPO.operatorHub.knativeCamelOperatorCard).click();
        break;
      }
      case 'Eclipse Che':
      case operators.EclipseCheOperator: {
        cy.byTestID('eclipse-che-community-operators-openshift-marketplace').click();
        break;
      }
      case 'GitOps':
      case operators.GitOpsOperator: {
        cy.get(operatorsPO.operatorHub.gitOpsOperatorCard).click();
        break;
      }
      case 'Web Terminal':
      case operators.WebTerminalOperator: {
        cy.get(operatorsPO.operatorHub.webTerminalOperatorCard).click();
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

  verifyOperatorInNavigationMenu: (operatorName: string) => {
    cy.get(operatorsPO.nav.menuItems).should('have.length.greaterThan', 62);
    cy.get(operatorsPO.nav.menuItems)
      .contains(operatorName)
      .should('be.visible');
  },

  clickOnCreate: () => cy.byButtonText('Install').click(),
  clickOnCancel: () => cy.byButtonText('Cancel').click(),
};
