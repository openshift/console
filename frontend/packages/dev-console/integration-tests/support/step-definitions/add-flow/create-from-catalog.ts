import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addPage } from '../../pages/add-flow/add-page';
import { addOptions } from '../../constants/add';
import { catalogPageObj, catalogPage } from '../../pages/add-flow/catalog-page';

When('user selects From Catalog card from add page', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user searches {string} card from catalog page', (cardName: string) => {
  catalogPage.search(cardName);
});

When('user selects {string} option from Type section', (catalogType: string) => {
  catalogPage.selectCatalogTypeCheckBox(catalogType);
});

When('user selects Template card {string} from catalog page', (cardName: string) => {
  cy.get(catalogPageObj.catalogTypes.template).should('be.checked');
  catalogPage.selectCardInCatalog(cardName);
});

When('user clicks create button on Instantiate Template page with default values', () => {
  cy.byButtonText('Create')
    .scrollIntoView()
    .click();
});

Then(
  'user is ale to see Operator Backed, Helm Charts, Builder Image, Template, Service Class types are not selected by default',
  () => {
    cy.get(catalogPageObj.catalogTypes.operatorBacked).should('not.be.checked');
    cy.get(catalogPageObj.catalogTypes.helmCharts).should('not.be.checked');
    cy.get(catalogPageObj.catalogTypes.builderImage).should('not.be.checked');
    cy.get(catalogPageObj.catalogTypes.template).should('not.be.checked');
    cy.get(catalogPageObj.catalogTypes.serviceClass).should('not.be.checked');
  },
);

Then('search option is displayed in Developer Catalog page', () => {
  cy.get(catalogPageObj.search).should('be.visible');
});

Then('GroupBy filter is selected with default option None', () => {
  cy.get(catalogPageObj.groupBy)
    .find('span')
    .should('contain.text', 'None');
});

Then('user is able to see cards with name contains {string}', (name: string) => {
  cy.get(catalogPageObj.card).should('be.visible');
  catalogPage.verifyCardName(name);
});

Then('user is able to see cards related to {string}', (type: string) => {
  cy.get(catalogPageObj.cardType).should('contain.text', type);
});

Then('user will be redirected to Developer Catalog page', () => {
  cy.titleShouldBe('Developer Catalog');
});

When('user eneters Name as {string} in Instantiate Template page', (name: string) => {
  cy.get('#NAME')
    .clear()
    .type(name);
});
