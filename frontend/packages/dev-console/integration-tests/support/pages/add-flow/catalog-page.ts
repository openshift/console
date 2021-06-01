import { cardTitle, catalogPO } from '../../pageObjects/add-flow-po';
import { pageTitle } from '../../constants/pageTitle';
import { addPage } from './add-page';
import { addOptions, catalogCards, catalogTypes } from '../../constants/add';
import { topologyHelper } from '@console/topology/integration-tests/support/pages/topology/topology-helper-page';
import { helmPO } from '../../pageObjects/helm-po';
import { app, navigateTo } from '../app';
import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { devNavigationMenu } from '../../constants';

export const catalogPage = {
  verifyTitle: () => detailsPage.titleShouldContain('Developer Catalog'),
  verifyPageTitle: (page: string) => detailsPage.titleShouldContain(page),
  isCheckBoxSelected: (type: string) => cy.get(`input[title="${type}"]`).should('be.checked'),
  isCardsDisplayed: () => {
    app.waitForLoad();
    cy.get(catalogPO.card).should('be.visible');
  },
  search: (keyword: string) => {
    cy.get('.skeleton-catalog--grid').should('not.exist');
    cy.get(catalogPO.search)
      .clear()
      .type(keyword);
  },
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
        cy.get(catalogPO.catalogTypes.managedServices).click();
        break;
      }
      case catalogTypes.EventSources:
      case 'Event Sources': {
        cy.get(catalogPO.catalogTypes.eventSources).click();
        break;
      }
      default: {
        throw new Error('Card is not available in Catalog');
      }
    }
  },
  selectTemplateTypes: (type: string | catalogTypes) => {
    cy.get(catalogPO.catalogTypeLink)
      .contains(type)
      .scrollIntoView()
      .click();
    cy.log(`Select ${type} from Types section`);
  },
  selectKnativeServingCard: () =>
    cy
      .get(cardTitle, { timeout: 40000 })
      .contains('Knative Serving')
      .click(),
  selectHelmChartCard: (cardName: string) => cy.byTestID(`HelmChart-${cardName}`).click(),
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
    cy.get('.skeleton-catalog--grid').should('not.exist');
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
      case catalogCards.knativeKafka: {
        cy.get(catalogPO.cards.knativeKafka).click();
        break;
      }
      case catalogCards.jenkins: {
        cy.get('div.catalog-tile-pf-title')
          .contains('Jenkins')
          .first()
          .click();
        break;
      }
      case 'Nodejs Ex K v0.2.1': {
        cy.get(catalogPO.cards.helmNodejs).click();
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
  verifyChartListAvailable: () => {
    cy.get(catalogPO.cardList)
      .should('exist')
      .find(catalogPO.cardHeader)
      .its('length')
      .should('be.greaterThan', 0);
  },
  verifyChartCardsAvailable: () => {
    cy.get(catalogPO.cardList)
      .should('exist')
      .find(catalogPO.cardHeader)
      .each(($el) => {
        expect('Helm Charts').toContain($el.text());
      });
  },
  verifyFilterByKeywordField: () => {
    cy.get('.pf-c-search-input__text-input').should('be.visible');
  },
  verifySortDropdown: () => {
    cy.get(catalogPO.groupBy).then((body) => {
      if (body.find(catalogPO.groupByMenu).length <= 0) {
        cy.get(catalogPO.groupBy).click();
      }
    });
    cy.get(catalogPO.aToz).should('be.visible');
    cy.get(catalogPO.zToA).should('be.visible');
  },
  createHelmChartFromAddPage: (
    releaseName: string = 'nodejs-ex-k',
    helmChartName: string = 'Nodejs Ex K v0.2.1',
  ) => {
    navigateTo(devNavigationMenu.Add);
    app.waitForDocumentLoad();
    addPage.selectCardFromOptions(addOptions.HelmChart);
    catalogPage.verifyPageTitle(pageTitle.HelmCharts);
    catalogPage.isCardsDisplayed();
    catalogPage.search(helmChartName);
    catalogPage.selectHelmChartCard(helmChartName);
    catalogPage.verifyDialog();
    catalogPage.clickButtonOnCatalogPageSidePane();
    catalogPage.verifyInstallHelmChartPage();
    catalogPage.enterReleaseName(releaseName);
    catalogPage.clickOnInstallButton();
    app.waitForDocumentLoad();
    topologyHelper.verifyWorkloadInTopologyPage(releaseName);
  },
  verifyCategories: () => {
    const categories = ['All items', 'CI/CD', 'Databases', 'Languages', 'Middleware', 'Other'];
    cy.get(
      'ul.vertical-tabs-pf.restrict-tabs li.vertical-tabs-pf-tab.shown.text-capitalize.co-catalog-tab__empty >a',
    ).each(($el) => {
      expect(categories).toContain($el.text());
    });
  },
  verifyTypes: () => {
    const categories = [
      'Builder Images',
      'Devfiles',
      'Event Sources',
      'Helm Charts',
      'Operator Backed',
      'Templates',
    ];
    cy.get('ul.vertical-tabs-pf.restrict-tabs')
      .eq(6)
      .find('li a')
      .each(($el) => {
        expect(categories).toContain($el.text());
      });
  },
  verifyCardTypeOfAllCards: (cardType: string) => {
    cy.get(catalogPO.card).each(($card) => {
      expect($card.find(catalogPO.cardBadge).text()).toContain(cardType);
    });
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
