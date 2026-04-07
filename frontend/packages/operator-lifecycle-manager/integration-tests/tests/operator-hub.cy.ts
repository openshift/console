import { checkErrors, testName } from '@console/cypress-integration-tests/support';

describe('Interacting with Operators', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProjectWithCLI(testName);
  });

  it('displays Operator catalog items with expected available Operators', () => {
    cy.log('navigate to Software Catalog');
    cy.visit(`/catalog/ns/${testName}`);
    cy.byTestID('page-heading').should('contain.text', 'Software Catalog');
    cy.log('more than one tile should be present');
    cy.byTestID('tab operator').click();
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
    cy.log('enable the Community filter');
    cy.byTestID('source-community').click();
    cy.log('more than one tile should be present');
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
    cy.log('track which tile is first');
    // eslint-disable-next-line promise/catch-or-return
    cy.get('.co-catalog-tile')
      .first()
      .then(($origCatalogTitle) => {
        const origCatalogTitleTxt = $origCatalogTitle.find('.catalog-tile-pf-title').text();
        cy.log(`first Community filtered tile title text is ${origCatalogTitleTxt}`);
        cy.log('disable the Community filter');
        cy.byTestID('source-community').click();
        cy.log('enable the Certified filter');
        cy.byTestID('source-certified').click();
        cy.log('more than one tile should be present');
        cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
        cy.log('the first tile title text for Certified should not be the same as Community');
        cy.get('.co-catalog-tile')
          .first()
          .find('.catalog-tile-pf-title')
          .invoke('text')
          .should('not.equal', origCatalogTitleTxt);
      });

    cy.log('filters Operators by name');
    const operatorName = 'Datadog Operator';
    cy.byTestID('search-catalog').type(operatorName);
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
    cy.get('.co-catalog-tile')
      .first()
      .find('.catalog-tile-pf-title')
      .should('have.text', operatorName);
    cy.byTestID('search-catalog').find('input').clear();

    cy.log('displays "Clear All Filters" link when text filter removes all Operators from display');
    cy.log('enter a search query that will return zero results');
    cy.byTestID('search-catalog').type('NoOperatorsTest');
    cy.get('.co-catalog-tile').should('not.exist');
    cy.byLegacyTestID('catalog-clear-filters').should('exist');

    cy.log('clears text filter when "Clear All Filters" link is clicked');
    cy.byLegacyTestID('catalog-clear-filters').click();
    cy.byTestID('search-catalog').get('input').should('be.empty');
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);

    cy.log('filters Operators by category');
    const filterLabel = 'tab ai/machine learning';
    cy.log(`click the ${filterLabel} filter`);
    cy.get(`[data-test="${filterLabel}"] > a`).click();
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
  });
});
