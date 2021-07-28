import { checkErrors } from '../../support';
import { DetailsPageSelector } from '../../views/details-page';
import { listPage, ListPageSelector } from '../../views/list-page';
import { masthead } from '../../views/masthead';

describe('Localization', () => {
  before(() => {
    cy.login();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  it('pseudolocalizes masthead', () => {
    cy.log('test masthead');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    masthead.clickMastheadLink('help-dropdown-toggle');
    // wait for both console help menu items and additionalHelpActions items to load
    // additionalHelpActions come from ConsoleLinks 'HelpMenu' yaml and are not translated
    cy.get('.pf-c-app-launcher__group').should('have.length', 2);
    // only test console help items which are translated
    cy.get('.pf-c-app-launcher__group')
      .first()
      .within(() => {
        cy.get('[role="menuitem"]').isPseudoLocalized();
      });
  });

  it('pseudolocalizes navigation', () => {
    cy.log('test navigation');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    cy.byTestID('nav').isPseudoLocalized();
  });

  it('pseudolocalizes activity card', () => {
    cy.log('test activity card components');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    cy.byTestID('activity').isPseudoLocalized();
    cy.byTestID('activity-recent-title').isPseudoLocalized();
    cy.byTestID('ongoing-title').isPseudoLocalized();
    cy.byTestID('events-view-all-link').isPseudoLocalized();
    cy.byTestID('events-pause-button').isPseudoLocalized();
  });

  it('pseudolocalizes utilization card', () => {
    cy.log('test utilization card components');
    cy.visit('/dashboards?pseudolocalization=true&lng=en');
    cy.byLegacyTestID('utilization-card').within(() => {
      cy.byTestID('dashboard-card-title').isPseudoLocalized();
      cy.byTestID('utilization-card-item-text').isPseudoLocalized();
    });
  });

  it('pseudolocalizes monitoring pages', () => {
    const monitoringPages = ['alerts', 'silences', 'alertrules'];
    monitoringPages.forEach((page) => {
      cy.visit(`/monitoring/${page}?pseudolocalization=true&lng=en`);
      if (page === 'alerts' || page === 'alertrules') {
        listPage.rows.shouldBeLoaded();
        cy.get(ListPageSelector.tableColumnHeaders).isPseudoLocalized();
        cy.get(DetailsPageSelector.horizontalNavTabs).isPseudoLocalized();
      }
      // check applied filters are i18ned then clear all filters
      cy.get('.pf-c-chip-group__main').then((groups) => {
        if (groups.length >= 1) {
          cy.get('[class*="pf-c-chip-group"]').isPseudoLocalized();
        }
        listPage.filter.clearAllFilters();
      });
      // check filter dropdown items & search by items i18ned
      listPage.filter.clickFilterDropdown();
      cy.get('.pf-c-select__menu').within(() => {
        cy.get('.pf-c-select__menu-group-title').isPseudoLocalized();
        cy.get('.co-filter-dropdown-item__name').isPseudoLocalized();
      });
      if (page === 'alerts' || page === 'alertrules') {
        listPage.filter.clickSearchByDropdown();
        cy.get('.pf-c-dropdown__menu').within(() => {
          cy.get('.pf-c-dropdown__menu-item').isPseudoLocalized();
        });
      } else {
        cy.byTestID('create-silence-btn').isPseudoLocalized();
      }
    });
  });
});
