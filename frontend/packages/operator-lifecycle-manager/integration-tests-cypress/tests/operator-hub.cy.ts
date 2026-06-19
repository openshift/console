import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { OPERATOR_HUB_LOAD_TIMEOUT, operatorHub } from '../views/operator-hub.view';

describe('Interacting with OperatorHub', () => {
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

  it('displays OperatorHub tile view with expected available Operators', () => {
    cy.log('navigate to OperatorHub');
    nav.sidenav.clickNavLink(['Operators', 'OperatorHub']);
    cy.url().should('include', '/operatorhub/all-namespaces');
    operatorHub.waitForLoaded();
    cy.log('more than one tile should be present');
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);

    cy.log('enable the Red Hat filter');
    cy.byTestID('catalogSourceDisplayName-red-hat', { timeout: OPERATOR_HUB_LOAD_TIMEOUT })
      .should('be.visible')
      .click();
    cy.log('more than one tile should be present');
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
    cy.log('track which tile is first');
    // eslint-disable-next-line promise/catch-or-return
    cy.get('.co-catalog-tile')
      .first()
      .then(($origCatalogTitle) => {
        const origCatalogTitleTxt = $origCatalogTitle.find('.catalog-tile-pf-title').text();
        cy.log(`first Red Hat filtered tile title text is ${origCatalogTitleTxt}`);
        cy.log('disable the Red Hat filter');
        cy.byTestID('catalogSourceDisplayName-red-hat', { timeout: OPERATOR_HUB_LOAD_TIMEOUT })
          .should('be.visible')
          .click();
        cy.log('enable the Certified filter');
        cy.byTestID('catalogSourceDisplayName-certified', { timeout: OPERATOR_HUB_LOAD_TIMEOUT })
          .should('be.visible')
          .click();
        cy.log('wait for the Certified results to replace the Red Hat list');
        cy.get('.co-catalog-tile').should(($tiles) => {
          expect($tiles.length).to.be.gt(0);
          expect($tiles.first().find('.catalog-tile-pf-title').text()).not.to.equal(
            origCatalogTitleTxt,
          );
        });
      });

    cy.log('filters Operators by name');
    const operatorName = 'Datadog Operator';
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
    cy.get('.co-catalog-tile')
      .first()
      .find('.catalog-tile-pf-title')
      .should('have.text', operatorName);
    cy.byTestID('search-operatorhub').find('input').clear();

    cy.log('displays "Clear All Filters" link when text filter removes all Operators from display');
    cy.log('enter a search query that will return zero results');
    cy.byTestID('search-operatorhub').type('NoOperatorsTest');
    cy.get('.co-catalog-tile').should('not.exist');
    cy.byLegacyTestID('catalog-clear-filters').should('exist');

    cy.log('clears text filter when "Clear All Filters" link is clicked');
    cy.byLegacyTestID('catalog-clear-filters').click();
    cy.byTestID('search-operatorhub').get('input').should('be.empty');
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);

    cy.log('filters Operators by category');
    const filterLabel = 'AI/Machine Learning';
    cy.log(`click the ${filterLabel} filter`);
    cy.get(`[data-test="${filterLabel}"] > a`).click();
    cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
  });
});
