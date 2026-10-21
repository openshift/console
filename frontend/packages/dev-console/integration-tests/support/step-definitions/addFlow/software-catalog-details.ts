import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions, catalogTypes } from '../../constants';
import { catalogPO } from '../../pageObjects';
import { addPage, catalogPage } from '../../pages';

When('user clicks on From Catalog card', () => {
  addPage.selectCardFromOptions(addOptions.SoftwareCatalog);
});

When('user clicks on Event Sources type', () => {
  catalogPage.selectCatalogType(catalogTypes.EventSources);
});

When('user clicks on Helm Charts type', () => {
  catalogPage.selectCatalogType(catalogTypes.HelmCharts);
});

Then('user will see All Items already selected', () => {
  cy.byTestID('catalog-heading').should('contain.text', 'All items');
});

Then('user will see CICD, Databases, Languages, Middleware, Other categories', () => {
  catalogPage.verifyCategories();
});

Then('user will see {string}, {string}, {string}, {string} types', (el1, el2, el3, el4: string) => {
  catalogPage.verifyTypes(el1);
  catalogPage.verifyTypes(el2);
  catalogPage.verifyTypes(el3);
  catalogPage.verifyTypes(el4);
});

Then('user will see Filter by Keyword field', () => {
  cy.get(catalogPO.search).should('have.attr', 'placeholder', 'Filter by keyword...');
});

Then('user will see A-Z, Z-A sort by dropdown', () => {
  cy.get('.co-catalog-page__sort').click();
  cy.byTestDropDownMenu('asc').should('be.visible');
  cy.byTestDropDownMenu('desc').should('be.visible');
  cy.get('.co-catalog-page__sort').click();
});

Then('user will see the cards of Helm Charts', () => {
  catalogPage.verifyHelmChartCardsAvailable();
});
