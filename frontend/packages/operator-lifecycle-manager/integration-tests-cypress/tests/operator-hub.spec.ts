import { expect } from 'chai';
import { checkErrors, testName } from '../../../integration-tests-cypress/support';
import { nav } from '../../../integration-tests-cypress/views/nav';
import { OPERATOR_HUB_LOAD_TIMEOUT, operatorHub } from '../views/operator-hub.view';

xdescribe('Interacting with OperatorHub', () => {
  before(() => {
    cy.login();
    cy.visit('/');
    nav.sidenav.switcher.changePerspectiveTo('Administrator');
    nav.sidenav.switcher.shouldHaveText('Administrator');
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  it('displays OperatorHub tile view with expected available Operators', () => {
    cy.log('navigate to OperatorHub');
    nav.sidenav.clickNavLink(['Operators', 'OperatorHub']);
    cy.url().should('include', `/operatorhub/ns/${testName}`);
    operatorHub.waitForLoaded();
    cy.log('more than one tile should be present');
    cy.get('.catalog-tile-pf').its('length').should('be.gt', 0);
  });

  it('displays OperatorHub tiles filtered by "Source"', () => {
    operatorHub.waitForLoaded();
    cy.log('enable the Red Hat filter');
    cy.byTestID('catalogSourceDisplayName-red-hat', { timeout: OPERATOR_HUB_LOAD_TIMEOUT })
      .should('be.visible')
      .click();
    cy.log('more than one tile should be present');
    cy.get('.catalog-tile-pf').its('length').should('be.gt', 0);
    cy.log('track which tile is first');
    // eslint-disable-next-line promise/catch-or-return
    cy.get('.catalog-tile-pf')
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
        cy.get('.catalog-tile-pf').should(($tiles) => {
          expect($tiles.length).to.be.gt(0);
          expect($tiles.first().find('.catalog-tile-pf-title').text()).not.to.equal(
            origCatalogTitleTxt,
          );
        });
      });
  });

  it('filters Operators by name', () => {
    const operatorName = 'Datadog Operator';
    cy.byTestID('search-operatorhub').type(operatorName);
    cy.get('.catalog-tile-pf').its('length').should('be.gt', 0);
    cy.get('.catalog-tile-pf')
      .first()
      .find('.catalog-tile-pf-title')
      .should('have.text', operatorName);
    cy.byTestID('search-operatorhub').clear();
  });

  it('displays "Clear All Filters" link when text filter removes all Operators from display', () => {
    cy.log('enter a search query that will return zero results');
    cy.byTestID('search-operatorhub').type('NoOperatorsTest');
    cy.get('.catalog-tile-pf').should('not.exist');
    cy.byLegacyTestID('catalog-clear-filters').should('exist');
  });

  it('clears text filter when "Clear All Filters" link is clicked', () => {
    cy.byLegacyTestID('catalog-clear-filters').click();
    cy.byTestID('search-operatorhub').get('input').should('be.empty');
    cy.get('.catalog-tile-pf').its('length').should('be.gt', 0);
  });

  it('filters Operators by category', () => {
    const filterLabel = 'AI/Machine Learning';
    cy.log(`click the ${filterLabel} filter`);
    cy.get(`[data-test="${filterLabel}"] > a`).click();
    cy.get('.catalog-tile-pf').its('length').should('be.gt', 0);
  });
});
