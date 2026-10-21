import { checkErrors } from '../../support';
import { nav } from '../../views/nav';

describe('Favorites', () => {
  before(() => {
    // clear any existing sessions
    Cypress.session.clearAllSavedSessions();
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.visit('/');
  });

  it('Should show No favorites added message when no favorites are added', () => {
    nav.sidenav.clickNavLink(['Favorites']);
    cy.byTestID('no-favorites-message').should('be.visible');
  });

  it('Should open Add to Favorites modal on click of favorite icon', () => {
    cy.get('[data-test="favorite-button"]').click({ force: true });
    cy.get('[role="dialog"]').contains('Add to favorites');
  });

  it('Should save a favorite', () => {
    cy.visit('/');
    cy.get('[data-test="favorite-button"]').click({ force: true });
    cy.get('[role="dialog"]').contains('Add to favorites');
    cy.get('#confirm-favorite-form-name').should('have.value', 'Overview');
    cy.get('#confirm-favorite-form-name')
      .clear({ force: true })
      .type('test-favorite', { force: true });
    cy.contains('button', 'Save').click({ force: true });
    nav.sidenav.shouldHaveNavSection(['Favorites', 'test-favorite']);
  });

  it('Should remove a favorite', () => {
    cy.visit('/');
    cy.get('[data-test="favorite-button"]').click({ force: true });
    nav.sidenav.clickNavLink(['Favorites']);
    cy.byTestID('no-favorites-message').should('be.visible');
  });

  it('Should remove a favorite from left navigation menu', () => {
    cy.visit('/');
    cy.get('[data-test="favorite-button"]').click({ force: true });
    cy.get('[role="dialog"]').contains('Add to favorites');
    cy.contains('button', 'Save').click({ force: true });
    nav.sidenav.shouldHaveNavSection(['Favorites', 'Overview']);
    cy.get('[data-test="remove-favorite-button"]').click({ force: true });
    nav.sidenav.clickNavLink(['Favorites']);
    cy.byTestID('no-favorites-message').should('be.visible');
  });

  it('Should disable add to favorite button when limit reached', () => {
    const pages = [
      '/',
      '/k8s/all-namespaces/core~v1~Pod',
      '/k8s/all-namespaces/apps~v1~Deployment',
      '/k8s/all-namespaces/core~v1~Secret',
      '/k8s/all-namespaces/core~v1~ConfigMap',
      '/k8s/cluster/core~v1~Node',
      '/k8s/all-namespaces/batch~v1~CronJob',
      '/k8s/all-namespaces/batch~v1~Job',
      '/k8s/all-namespaces/apps~v1~ReplicaSet',
      '/k8s/all-namespaces/core~v1~ReplicationController',
    ];

    pages.forEach((page, index) => {
      cy.visit(page);
      cy.get('[data-test="favorite-button"]').first().click({ force: true });
      cy.get('[role="dialog"]').contains('Add to favorites');
      cy.get('#confirm-favorite-form-name')
        .clear({ force: true })
        .type(`test-favorite-${index}{enter}`, { force: true });
      if (index < pages.length - 1) {
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000);
      }
    });

    cy.visit('/k8s/all-namespaces/apps~v1~DaemonSet');
    cy.get('[data-test="favorite-button"]').first().should('be.disabled');
  });
});
