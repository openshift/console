import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions, catalogTypes } from '../../constants';
import { catalogPO } from '../../pageObjects';
import { addPage, catalogPage } from '../../pages';

When('user clicks on From Catalog card', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user clicks on Event Sources type', () => {
  catalogPage.selectCatalogType(catalogTypes.EventSources);
});

When('user clicks on Helm Charts type', () => {
  catalogPage.selectCatalogType(catalogTypes.HelmCharts);
});

Then('user will see All Items already selected', () => {
  cy.get('.co-catalog-page__heading').should('contain.text', 'All items');
});

Then('user will see CICD, Databases, Languages, Middleware, Other categories', () => {
  catalogPage.verifyCategories();
});

Then(
  'user will see Builder Images, Event Sources, Helm Charts, Operator Backed, Templates types',
  () => {
    catalogPage.verifyTypes();
  },
);

Then('user will see Filter by Keyword field', () => {
  cy.get(catalogPO.search).should('have.attr', 'placeholder', 'Filter by keyword...');
});

Then('user will see A-Z, Z-A sort by dropdown', () => {
  cy.get('.co-catalog-page__sort').click();
  cy.byTestDropDownMenu('asc').should('be.visible');
  cy.byTestDropDownMenu('desc').should('be.visible');
  cy.get('.co-catalog-page__sort').click();
});

Then('user will see the cards of Event Sources', () => {
  catalogPage.verifyCardTypeOfAllCards('Event Sources');
});

Then('user will see the cards of Helm Charts', () => {
  catalogPage.verifyHelmChartCardsAvailable();
});
