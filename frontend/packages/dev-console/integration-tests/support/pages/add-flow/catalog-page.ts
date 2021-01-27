import { cardTitle, catalogPO } from '../../pageObjects/add-flow-po';
import { pageTitle } from '../../constants/pageTitle';
import { addPage } from './add-page';
import { addOptions, catalogCards, catalogTypes } from '../../constants/add';
import { topologyHelper } from '../topology/topology-helper-page';
import { helmPO } from '../../pageObjects/helm-po';

export const catalogPage = {
  verifyTitle: () => cy.pageTitleShouldContain('Developer Catalog'),
  verifyPageTitle: (page: string) => cy.pageTitleShouldContain(page),
  isCheckBoxSelected: (type: string) => cy.get(`input[title="${type}"]`).should('be.checked'),
  isCardsDisplayed: () => cy.get(catalogPO.card).should('be.visible'),
  search: (keyword: string) =>
    cy
      .get(catalogPO.search)
      .clear()
      .type(keyword),
  verifyDialog: () => cy.get(catalogPO.sidePane.dialog).should('be.visible'),
  verifyInstallHelmChartPage: () =>
    cy
      .get('form h1')
      .eq(0)
      .should('have.text', pageTitle.InstallHelmCharts),
  clickButtonOnCatalogPageSidePane: () => {
    catalogPage.verifyDialog();
    cy.get(catalogPO.sidePane.instantiateTemplate).click({ force: true });
  },
  clickOnCancelButton: () => cy.byButtonText('Cancel').click(),
  selectCatalogType: (type: string | catalogTypes) => {
    switch (type) {
      case catalogTypes.OperatorBacked:
      case 'Operator Backed': {
        cy.get(catalogPO.catalogTypes.operatorBacked).click();
        break;
      }
      case catalogTypes.HelmCharts:
      case 'Helm Charts': {
        cy.get(catalogPO.catalogTypes.helmCharts).click();
        break;
      }
      case catalogTypes.BuilderImage:
      case 'Builder Images': {
        cy.get(catalogPO.catalogTypes.builderImage).click();
        break;
      }
      case catalogTypes.Template:
      case 'Templates': {
        cy.get(catalogPO.catalogTypes.template).click();
        break;
      }
      case catalogTypes.ServiceClass:
      case 'Service Class': {
        cy.get(catalogPO.catalogTypes.serviceClass).click();
        break;
      }
      case catalogTypes.ManagedServices:
      case 'Managed Services': {
        cy.get(catalogPO.catalogTypes.managedServices).check();
        break;
      }
      default: {
        throw new Error('Card is not available in Catalog');
      }
    }
  },
  selectTemplateTypes: (type: string | catalogTypes) => {
    switch (type) {
      case 'CI/CD': {
        cy.get('li.vertical-tabs-pf-tab.shown.text-capitalize.co-catalog-tab__empty')
          .contains('CI/CD')
          .click();
        break;
      }
      case 'Databases': {
        cy.get('li.vertical-tabs-pf-tab.shown.text-capitalize.co-catalog-tab__empty')
          .contains('Databases')
          .click();
        break;
      }
      case 'Languages': {
        cy.get('li.vertical-tabs-pf-tab.shown.text-capitalize.co-catalog-tab__empty')
          .contains('Languages')
          .click();
        break;
      }
      case 'Middleware': {
        cy.get('li.vertical-tabs-pf-tab.shown.text-capitalize.co-catalog-tab__empty')
          .contains('Middleware')
          .click();
        break;
      }
      case 'Other': {
        cy.get('li.vertical-tabs-pf-tab.shown.text-capitalize.co-catalog-tab__empty')
          .contains('Other')
          .click();
        break;
      }
      default: {
        throw new Error("Couldn't find that type");
      }
    }
  },
  selectKnativeServingCard: () =>
    cy
      .get(cardTitle, { timeout: 40000 })
      .contains('Knative Serving')
      .click(),
  selectHelmChartCard: (cardName: string) =>
    cy
      .get(cardTitle, { timeout: 40000 })
      .contains(cardName)
      .click(),
  clickOnInstallButton: () => {
    cy.get(catalogPO.installHelmChart.install).click();
    cy.get('.co-m-loader', { timeout: 40000 }).should('not.exist');
  },
  enterReleaseName: (releaseName: string) =>
    cy
      .get(catalogPO.installHelmChart.releaseName)
      .clear()
      .type(releaseName),
  selectCardInCatalog: (card: catalogCards | string) => {
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    switch (card) {
      case catalogCards.mariaDB || 'MariaDB': {
        cy.get(catalogPO.cards.mariaDBTemplate).click();
        break;
      }
      case catalogCards.cakePhp || 'CakePHP + MySQL': {
        cy.get(catalogPO.cards.phpCakeTemplate).click();
        break;
      }
      case catalogCards.nodeJs || 'Node.js': {
        cy.get(catalogPO.cards.nodeJsBuilderImage).click();
        break;
      }
      case catalogCards.nodeJsPostgreSQL: {
        cy.get(catalogPO.cards.nodejsPostgreSQL).click();
        break;
      }
      case catalogCards.apacheHTTPServer: {
        cy.get(catalogPO.cards.apacheHTTPServer).click();
        break;
      }
      case catalogCards.nginxHTTPServer: {
        cy.get(catalogPO.cards.nginxHTTPServer).click();
        break;
      }
      case catalogCards.jenkins: {
        cy.get('div.catalog-tile-pf-title')
          .contains('Jenkins')
          .first()
          .click();
        break;
      }
      default: {
        throw new Error(`${card} card is not available in Catalog`);
      }
    }
  },
  verifyCardName: (partialCardName: string) => {
    cy.get(cardTitle).contains(partialCardName, { matchCase: false });
  },
  createHelmChartFromAddPage: (
    releaseName: string = 'nodejs-ex-k',
    helmChartName: string = 'Nodejs Ex K v0.2.1',
  ) => {
    cy.document()
      .its('readyState')
      .should('eq', 'complete');
    addPage.selectCardFromOptions(addOptions.HelmChart);
    catalogPage.verifyPageTitle('Helm Charts');
    catalogPage.isCardsDisplayed();
    catalogPage.search(helmChartName);
    catalogPage.selectHelmChartCard(helmChartName);
    catalogPage.verifyDialog();
    catalogPage.clickButtonOnCatalogPageSidePane();
    catalogPage.verifyInstallHelmChartPage();
    catalogPage.enterReleaseName(releaseName);
    catalogPage.clickOnInstallButton();
    cy.document()
      .its('readyState')
      .should('eq', 'complete');
    topologyHelper.verifyWorkloadInTopologyPage(releaseName);
  },
};

export const catalogInstallPageObj = {
  selectHelmChartVersion: (version: string) => cy.dropdownSwitchTo(version),
  verifyChartVersionDropdownAvailable: () => cy.isDropdownVisible(),
  selectChangeOfChartVersionDialog: (option: string) => {
    if (option === 'Proceed') {
      cy.get('#confirm-action').click();
    } else {
      cy.byLegacyTestID('modal-cancel-action').click();
    }
  },
  selectHelmChartCard: (cardName: string) => cy.dropdownSwitchTo(cardName),
};

export const sidePaneObj = {
  verifyChartVersion: () =>
    cy
      .get(helmPO.sidePane.chartVersion)
      .eq(0)
      .should('have.text', '0.2.1'),
};
