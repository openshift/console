import { catalogPO } from '../../pageObjects/add-flow-po';
import { catalogCards, catalogTypes } from '../../constants/add';

export const catalogPage = {
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
      .should('have.text', 'Install Helm Chart'),
  clickButtonOnCatalogPageSidePane: () => {
    catalogPage.verifyDialog();
    cy.get(catalogPO.sidePane.instantiateTemplate).click({ force: true });
  },
  clickOnCancelButton: () => cy.byButtonText('Cancel').click(),
  selectCatalogType: (type: string | catalogTypes) => {
    switch (type) {
      case catalogTypes.OperatorBacked:
      case 'Operator Backed': {
        cy.get(catalogPO.catalogTypes.operatorBacked).check();
        break;
      }
      case catalogTypes.HelmCharts:
      case 'Helm Charts': {
        cy.get(catalogPO.catalogTypes.helmCharts).check();
        break;
      }
      case catalogTypes.BuilderImage:
      case 'Builder Images': {
        cy.get(catalogPO.catalogTypes.builderImage).check();
        break;
      }
      case catalogTypes.Template:
      case 'Templates': {
        cy.get(catalogPO.catalogTypes.template).check();
        break;
      }
      case catalogTypes.ServiceClass:
      case 'Service Class': {
        cy.get(catalogPO.catalogTypes.serviceClass).check();
        break;
      }
      default: {
        throw new Error('Card is not available in Catalog');
      }
    }
  },
  selectknativeServingCard: () =>
    cy
      .get('div.catalog-tile-pf-title', { timeout: 40000 })
      .contains('Knative Serving')
      .click(),
  selectHelmChartCard: (cardName: string) =>
    cy
      .get('a div.catalog-tile-pf-title')
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
      default: {
        throw new Error(`${card} card is not available in Catalog`);
      }
    }
  },
  verifyCardName: (partialCardName: string) => {
    cy.get(catalogPO.card)
      .find('div.catalog-tile-pf-title')
      .should('contain.text', partialCardName);
  },
};
