import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, pageTitle } from '../../constants';
import { catalogPO } from '../../pageObjects';
import { addPage, catalogPage, gitPage } from '../../pages';

When('user selects From Catalog card from add page', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user searches {string} card from catalog page', (cardName: string) => {
  catalogPage.search(cardName);
});

When('user selects {string} option from Type section', (catalogType: string) => {
  catalogPage.selectCatalogType(catalogType);
});

When('user searches and selects {string} card from catalog page', (cardName: string) => {
  catalogPage.search(cardName);
  cy.get(catalogPO.catalogTypes.template).should('be.checked');
  catalogPage.selectCardInCatalog(cardName);
});

When('user searches and selects Template card {string} from catalog page', (cardName: string) => {
  catalogPage.search(cardName);
  detailsPage
    .titleShouldContain(pageTitle.Templates)
    .scrollIntoView()
    .should('be.visible');
  catalogPage.selectCardInCatalog(cardName);
});

When(
  'user searches and selects Builder Image card {string} from catalog page',
  (cardName: string) => {
    catalogPage.search(cardName);
    detailsPage.titleShouldContain(pageTitle.BuilderImages).should('be.visible');
    catalogPage.selectCardInCatalog(cardName);
  },
);

When('user enters workload name as {string}', (name: string) => {
  gitPage.enterWorkloadName(name);
});

When('user clicks Create Application button on side bar', () => {
  cy.get(catalogPO.sidePane.createApplication)
    .scrollIntoView()
    .click({ force: true });
});

When('user enters Git Repo url in s2i builder image page as {string}', (gitRepoUrl: string) => {
  cy.get(catalogPO.s2I.gitRepoUrl).type(gitRepoUrl);
});

When('user clicks create button on Instantiate Template page', () => {
  cy.get(catalogPO.create)
    .scrollIntoView()
    .click();
});

Then(
  'user is able to see Operator Backed, Helm Charts, Builder Image, Template, Service Class types are not selected by default',
  () => {
    cy.get(catalogPO.catalogTypes.operatorBacked).should('not.be.checked');
    cy.get(catalogPO.catalogTypes.helmCharts).should('not.be.checked');
    cy.get(catalogPO.catalogTypes.builderImage).should('not.be.checked');
    cy.get(catalogPO.catalogTypes.template).should('not.be.checked');
    cy.get(catalogPO.catalogTypes.serviceClass).should('not.be.checked');
  },
);

Then('search option is displayed in Developer Catalog page', () => {
  cy.get(catalogPO.search).should('be.visible');
});

Then('GroupBy filter is selected with default option A-Z', () => {
  cy.get(catalogPO.groupBy).should('have.text', 'A-Z');
});

Then('user is able to see cards with name containing {string}', (name: string) => {
  cy.get(catalogPO.card).should('be.visible');
  catalogPage.verifyCardName(name);
});

Then('user is able to see cards related to {string}', (type: string) => {
  cy.get(catalogPO.cardType).should('contain.text', type);
});

Then('user will be redirected to Operator Backed page from knative Serving page', () => {
  detailsPage.titleShouldContain(pageTitle.OperatorBacked).should('be.visible');
});

When('user enters Name as {string} in Instantiate Template page', (name: string) => {
  cy.get('#NAME')
    .clear()
    .type(name);
});

When('user selects {string} card from catalog page', (cardName: string) => {
  catalogPage.selectCardInCatalog(cardName);
});

When('user searches and selects {string} helm chart from catalog page', (helmChartName: string) => {
  catalogPage.search(helmChartName);
  catalogPage.selectHelmChartCard(helmChartName);
});

Given('user is at Templates page', () => {
  catalogPage.selectCatalogType('Templates');
});

When('user selects {string} from Templates type', (templateType: string) => {
  catalogPage.selectTemplateTypes(templateType);
});
