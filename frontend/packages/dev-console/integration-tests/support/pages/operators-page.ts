import { operators } from '../constants/global';

export const operatorsObj = {
  nav: {
    operatorHub: 'a[href="/operatorhub"]',
    installOperators: 'a[href$="/operators.coreos.com~v1alpha1~ClusterServiceVersion"]',
    link: 'li.pf-c-nav__item.pf-m-expandable',
    menuItems: '.pf-c-nav__link',
  },
  operatorHub: {
    search: 'input[placeholder="Filter by keyword..."]',
    numOfItems: 'div.co-catalog-page__num-items',
  },
  subscription: {
    logo: 'h1.co-clusterserviceversion-logo__name__clusterserviceversion',
  },
  installOperators: {
    title: 'h1.co-m-pane__heading',
    operatorsNameRow: 'div[aria-label="Installed Operators"] td:nth-child(1) h1',
    search: 'input[data-test-id="item-filter"]',
    noOperatorFoundMessage: 'div.cos-status-box__title',
  },
  sidePane: {
    install: 'a[data-test-id="operator-install-btn"]',
    uninstall: '[data-test-id="operator-uninstall-btn"]',
  },
  alertDialog: '[role="dialog"]',
  uninstallPopup: {
    uninstall: '#confirm-action',
  },
};

export const operatorsPage = {
  navigateToOperaotorHubPage: () => {
    cy.get(operatorsObj.nav.link)
      .contains('Operators')
      .click();
    cy.get(operatorsObj.nav.operatorHub).click({ force: true });
    cy.pageTitleShouldContain('OperatorHub');
  },

  navigateToInstalloperatorsPage: () => {
    cy.get(operatorsObj.nav.link)
      .contains('Operators')
      .click();
    cy.get(operatorsObj.nav.link)
      .contains('Installed Operators')
      .click();
  },

  searchOperator: (operatorName: string) => {
    cy.get(operatorsObj.operatorHub.search)
      .should('be.visible')
      .type(operatorName);
    cy.get(operatorsObj.operatorHub.numOfItems).should('be.visible');
  },

  installOperator: () => {
    cy.get(operatorsObj.installOperators.title).should('have.text', 'Install Operator');
    cy.byButtonText('Install').click();
    cy.get('article h1').should('be.visible');
  },

  verifySubscriptionPage: (operatorLogo: string) =>
    cy.get(operatorsObj.subscription.logo).should('have.text', operatorLogo),

  verifyInstalledOperator: (operatorName: string) => {
    cy.get(operatorsObj.installOperators.search, { timeout: 50000 })
      .should('be.visible')
      .type(operatorName);
    cy.get(operatorsObj.installOperators.operatorsNameRow)
      .contains(operatorName, { timeout: 50000 })
      .should('contain.text', operatorName);
  },

  verifyOperatoNotAvailable: (operatorName: string) => {
    cy.get(operatorsObj.installOperators.search).type(operatorName);
    cy.get(operatorsObj.installOperators.noOperatorFoundMessage).should(
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
      case operators.pipelineOperator: {
        cy.byTestID(
          'openshift-pipelines-operator-rh-redhat-operators-openshift-marketplace',
        ).click();
        break;
      }
      case 'OpenShift Serverless Operator':
      case operators.serverlessOperator: {
        cy.byTestID('serverless-operator-redhat-operators-openshift-marketplace').click();
        break;
      }
      case 'OpenShift Virtualization':
      case operators.virtualizationOperator: {
        cy.byTestID('kubevirt-hyperconverged-redhat-operators-openshift-marketplace').click();
        break;
      }
      case 'knative Apache Camel Operator':
      case operators.knativeCamelOperator: {
        cy.byTestID('knative-camel-operator-community-operators-openshift-marketplace').click();
        cy.alertTitleShouldContain('Show Community Operator');
        cy.byTestID('confirm-action').click();
        break;
      }
      case 'Eclipse Che':
      case operators.eclipseCheOperator: {
        cy.byTestID('eclipse-che-community-operators-openshift-marketplace').click();
        cy.alertTitleShouldContain('Show Community Operator');
        cy.byTestID('confirm-action').click();
        break;
      }
      default: {
        throw new Error('operator is not available');
      }
    }
  },

  verifySiedPane: () => cy.get(operatorsObj.alertDialog).should('be.exist'),

  clickInstallOnSidePane: () => {
    cy.get(operatorsObj.alertDialog)
      // .should('be.visible');
      .then(($sidePane) => {
        if ($sidePane.find(operatorsObj.sidePane.install).length) {
          cy.get(operatorsObj.sidePane.install).click();
        } else {
          cy.log('Operator is already installed');
        }
      });
  },

  clickUninstallOnSidePane: () => {
    cy.get(operatorsObj.alertDialog).then(($sidePane) => {
      if ($sidePane.find(operatorsObj.sidePane.uninstall).length) {
        cy.get(operatorsObj.sidePane.uninstall).click();
      } else {
        cy.log('Operator is not installed');
      }
    });
  },

  verifyOperatorInNavigationMenu: (menuItem: string) => {
    cy.get(operatorsObj.nav.menuItems, { timeout: 50000 }).should('have.length.greaterThan', '62');
    cy.get(operatorsObj.nav.menuItems)
      .contains(menuItem)
      .should('be.visible');
  },

  clickOnCreate: () => cy.byButtonText('Install').click(),
  clickOnCancel: () => cy.byButtonText('Cancel').click(),
};
