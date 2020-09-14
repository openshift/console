import { addPage } from "../add-flow/add-page";
import { addOptions, caatalogCards } from "../../constants/add";
import { app } from "../app";

export const catalogPageObj = {
    search: 'input[placeholder="Filter by keyword..."]',
    card: 'a.pf-c-card',
    cards: {
      mariaDBTemplate: '[data-test="Template-mariadb-persistent"]'
    },
    sidePane: {
      dialog: '[role="dialog"]',
      instantiateTemplate: 'a[title="Instantiate Template"]',
      create: 'a[title="Create"]',
      installHelmChart:'a[title="Install Helm Chart"]',
      createHelmChart: 'a[title="Install Helm Chart"]',
    },
    mariaDBTemplate: {
      namespace: '#namespace',
      title: 'h1.co-m-pane__heading',
      memoryLimit: '#MEMORY_LIMIT',
      imageSrreamNameSpace: '#NAMESPACE',
      databaseServiceName: '#DATABASE_SERVICE_NAME',
      mariaDBConnectionUserName: '#MYSQL_USER',
    },
    createknativeServing: {
      logo: 'h1.co-clusterserviceversion-logo__name__clusterserviceversion',
      name: '#root_metadata_name',
      labels: 'input[placeholder="app=frontend"]',
    },
    installHelmChart: {
      logo: 'h1.co-clusterserviceversion-logo__name__clusterserviceversion',
      install: '[data-test-id="submit-button"]',
      releaseName: '#form-input-releaseName-field',
      yamlView: '#form-radiobutton-editorType-yaml-field',
      formView: '#form-radiobutton-editorType-form-field',
      cancel: '[data-test-id="reset-button"]',
    }
}

export const catalogPage = {
  verifyTitle:() => cy.titleShouldBe('Developer Catalog'),
  isCheckBoxSelected: (type: string) => cy.get(`input[title="${type}"]`).should('be.checked'),
  isCardsDisplayed:() => cy.get(catalogPageObj.card).should('be.visible'),
  search: (keyword: string) => cy.get(catalogPageObj.search).type(keyword),
  verifyDialog:() => cy.get(catalogPageObj.sidePane.dialog).should('be.visible'),
  verifyInstallHelmChartPage:() => cy.get('form h1').eq(0).should('have.text', 'Install Helm Chart'),
  clickInstantiateButtonOnSidePane:() => {
    catalogPage.verifyDialog();
    cy.get(catalogPageObj.sidePane.instantiateTemplate).click();
  },
  clickCreateButtonOnSidePane:() => {
    catalogPage.verifyDialog();
    cy.get(catalogPageObj.sidePane.create).click();
  },
  clickInstallHelmChartOnSidePane:() => {
    catalogPage.verifyDialog();
    cy.get(catalogPageObj.sidePane.installHelmChart).click();
  },
  clickOnCancelButton:() => cy.byButtonText('Cancel').click(),
  selectOperatorBackedCheckBox:() => cy.byTestID('kind-cluster-service-version').check(),
  selectknativeServingCard:() => cy.get('div.catalog-tile-pf-title').contains('knative Serving').click(),
  selectHelmChartCard:(cardName: string) => cy.get('a div.catalog-tile-pf-title').contains(cardName).click(),
  clickOnInstallButton:() => {
    cy.get(catalogPageObj.installHelmChart.install).click();
    app.waitForLoad(40000);
  },
  enterReleaseName:(releaseName: string) => 
    cy.get(catalogPageObj.installHelmChart.releaseName).clear().type(releaseName),
  createHelmChartFromAddPage:(releaseName: string = 'nodejs-ex-k', helmChartName: string = 'Nodejs Ex K v0.2.0') => {
    addPage.verifyCard('Helm Chart');
    addPage.selectCardFromOptions(addOptions.HelmChart);
    catalogPage.verifyTitle();
    catalogPage.isCardsDisplayed();
    catalogPage.search(helmChartName);
    catalogPage.selectHelmChartCard(helmChartName);
    catalogPage.verifyDialog();
    cy.get(catalogPageObj.sidePane.createHelmChart).click();
    catalogPage.verifyInstallHelmChartPage();
    catalogPage.enterReleaseName(releaseName);
    catalogPage.clickOnInstallButton();
    cy.get('[data-test-id="namespace-bar-dropdown"] a').as('switcher');
    cy.get('@switcher').click();
    cy.byLegacyTestID('item-filter').clear().type(releaseName);
    cy.get('div.is-filtered').should('be.visible');
    cy.get('@switcher').click();
  },
  selectCardInCatalog : (card: caatalogCards | string) => {
    cy.byLegacyTestID('perspective-switcher-toggle').click();
    switch (card) {
      case caatalogCards.mariaDB:
      case 'MariaDB':
      {
        cy.get(catalogPageObj.cards.mariaDBTemplate).click();
        break;
      }
      default: {
        throw new Error('Card is not available in Catalog');
      }
  }
}
}